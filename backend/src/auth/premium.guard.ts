import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { isPremiumActive } from "@/common/plan";

/** Use after AuthGuard: lets admins and users with active Premium through */
@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<{ user?: { id?: string } }>();
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException("User not authenticated");

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { role: true, plan: true, premiumUntil: true },
    });
    if (!user) throw new UnauthorizedException("User not authenticated");
    if (user.role === "ADMIN" || isPremiumActive(user)) return true;
    throw new ForbiddenException("This feature is part of Premium.");
  }
}
