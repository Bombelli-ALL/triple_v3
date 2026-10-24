import { PrismaService } from "@/prisma/prisma.service";
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import type { CookieOptions, Request, Response } from "express";
import * as bcrypt from "bcrypt";
import { getPrismaErrorCode } from "@/prisma/prisma-error.util";
import { normalizeJsonInput } from "@/prisma/prisma-json.util";
import { OAuth2Client } from "google-auth-library";
import { PlanService } from "@/services/plan.service";

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly planService: PlanService,
  ) {}

  async register(data: RegisterDto) {
    // Reject a bad referral code before creating the account so the user can fix it
    const referralCode = data.referralCode?.trim();
    if (referralCode) await this.planService.findUsableCode(referralCode);

    try {
      const user = await this.prismaService.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash: await bcrypt.hash(data.password, 12),
          authMethod: "PASSWORD",
          authProviderId: null,
          preferences: normalizeJsonInput(data.preferences),
          role: data.role === "GUIDE" ? "GUIDE" : "TRAVELER",
        },
      });
      if (referralCode) await this.planService.redeem(user.id, referralCode);
    } catch (e) {
      if (getPrismaErrorCode(e) === "P2002")
        throw new ConflictException(
          "A user with the same email is already registered",
        );
      throw e;
    }
  }

  async login(loginDto: LoginDto, res: Response) {
    const user = await this.prismaService.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) throw new NotFoundException({ email: "email_not_found" });
    if (user.authMethod === "GOOGLE" || !user.passwordHash) {
      throw new UnauthorizedException({ email: "use_google_login" });
    }

    const valid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException({ password: "wrong_password" });

    return this.createSessionResponse(user, res);
  }

  async refresh(req: Request, res: Response) {
    try {
      const refreshtoken = req.cookies?.refreshtoken;

      if (!refreshtoken)
        throw new UnauthorizedException({
          message: "No refresh token provided",
        });

      const payload = this.jwtService.verify(refreshtoken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.prismaService.user.findUnique({
        where: { id: payload.id },
      });

      if (!user) throw new NotFoundException("user_not_found");
      this.touchLastSeen(user.id);

      const { passwordHash: passwd, ...userData } = user;

      return {
        user: userData,
        token: this.jwtService.sign(
          { id: user.id },
          { secret: process.env.JWT_SECRET, expiresIn: "1h" },
        ),
      };
    } catch (err) {
      this.logout(res);
      throw new UnauthorizedException("invalid_refresh_token");
    }
  }

  async logout(res: Response) {
    res.clearCookie("refreshtoken", this.refreshCookieOptions());
  }

  private async verifyGoogleToken(token: string) {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    return ticket.getPayload();
  }

  private createSessionResponse(
    user: {
      id: string;
      passwordHash: string | null;
    },
    res: Response,
  ) {
    const refreshToken = this.jwtService.sign(
      { id: user.id },
      { expiresIn: "30d", secret: process.env.JWT_REFRESH_SECRET },
    );
    this.touchLastSeen(user.id);

    res.cookie(
      "refreshtoken",
      refreshToken,
      this.refreshCookieOptions(30 * 24 * 60 * 60 * 1000),
    );

    const { passwordHash: _passwordHash, ...userData } = user;

    return {
      user: userData,
      token: this.jwtService.sign(
        { id: user.id },
        { expiresIn: "1h", secret: process.env.JWT_SECRET },
      ),
    };
  }

  /** Powers the admin's "active this week" numbers; never blocks a login */
  private touchLastSeen(userId: string) {
    void this.prismaService.user
      .update({ where: { id: userId }, data: { lastSeenAt: new Date() } })
      .catch(() => undefined);
  }

  private refreshCookieOptions(maxAge?: number): CookieOptions {
    const productionLike =
      process.env.NODE_ENV === "production" ||
      Boolean(
        process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID,
      );
    const secure = process.env.COOKIE_SECURE
      ? process.env.COOKIE_SECURE === "true"
      : productionLike;
    const sameSite =
      (process.env.COOKIE_SAME_SITE?.toLowerCase() as CookieOptions["sameSite"]) ||
      (secure ? "none" : "lax");
    const options: CookieOptions = {
      httpOnly: true,
      secure,
      sameSite,
      path: "/api/refresh",
    };

    if (maxAge) options.maxAge = maxAge;

    return options;
  }

  async googleLogin(token: string, res: Response) {
    try {
      const payload = await this.verifyGoogleToken(token);
      if (!payload) throw new Error("Invalid token");
      const { email, name, family_name, given_name, sub: googleId } = payload;

      if (!email) throw new Error("Google token does not contain email");
      if (!name && (!given_name || !family_name))
        throw new Error("Google token does not contain name information");

      let user = await this.prismaService.user.findFirst({ where: { email } });
      if (!user) {
        user = await this.prismaService.user.create({
          data: {
            name: name || `${given_name} ${family_name}`,
            email,
            avatarUrl: payload.picture ?? null,
            passwordHash: null,
            authMethod: "GOOGLE",
            authProviderId: googleId,
            role: "TRAVELER",
          },
        });
      } else if (user.authMethod === "PASSWORD") {
        throw new UnauthorizedException({ email: "use_password_login" });
      } else if (!user.authProviderId) {
        user = await this.prismaService.user.update({
          where: { id: user.id },
          data: { authProviderId: googleId },
        });
      }

      return this.createSessionResponse(user, res);
    } catch (err) {
      return { error: "Invalid Google token" };
    }
  }
}
