import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomInt } from "node:crypto";
import { PrismaService } from "@/prisma/prisma.service";
import { describePlan, extendPremium, isPremiumActive } from "@/common/plan";

// No 0/O/1/I so codes are easy to read out loud or type from a screenshot
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DAY_MS = 86_400_000;

function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function generateCode() {
  const part = () =>
    Array.from(
      { length: 4 },
      () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)],
    ).join("");
  return `TRIP-${part()}-${part()}`;
}

export type CreateReferralCodeInput = {
  label?: string;
  premiumDays?: number;
  maxUses?: number | null;
  expiresAt?: string | null;
  code?: string;
};

@Injectable()
export class PlanService {
  constructor(private readonly prismaService: PrismaService) {}

  async getPlan(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { plan: true, premiumUntil: true },
    });
    if (!user) throw new NotFoundException("User not found");
    return describePlan(user);
  }

  /** Throws a readable 400 when the code can't be used (unknown, used up, expired, inactive) */
  async findUsableCode(rawCode: string) {
    const code = await this.prismaService.referralCode.findUnique({
      where: { code: normalizeCode(rawCode) },
    });
    if (!code || !code.active)
      throw new BadRequestException("This code is not valid.");
    if (code.expiresAt && code.expiresAt <= new Date())
      throw new BadRequestException("This code has expired.");
    if (code.maxUses != null && code.usedCount >= code.maxUses)
      throw new BadRequestException("This code has already been used up.");
    return code;
  }

  async redeem(userId: string, rawCode: string) {
    const code = await this.findUsableCode(rawCode);

    return this.prismaService.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { plan: true, premiumUntil: true },
      });
      if (!user) throw new NotFoundException("User not found");
      if (isPremiumActive(user) && !user.premiumUntil)
        throw new ConflictException(
          "You already have Premium with no end date.",
        );

      const already = await tx.referralRedemption.findUnique({
        where: { codeId_userId: { codeId: code.id, userId } },
      });
      if (already)
        throw new ConflictException("You have already used this code.");

      // Re-check the use limit inside the transaction so two people can't take the last use
      const claimed = await tx.referralCode.updateMany({
        where: {
          id: code.id,
          active: true,
          ...(code.maxUses != null ? { usedCount: { lt: code.maxUses } } : {}),
        },
        data: { usedCount: { increment: 1 } },
      });
      if (!claimed.count)
        throw new BadRequestException("This code has already been used up.");

      const premiumUntil = extendPremium(user, code.premiumDays);
      const updated = await tx.user.update({
        where: { id: userId },
        data: { plan: "PREMIUM", premiumUntil },
        select: { plan: true, premiumUntil: true },
      });
      await tx.referralRedemption.create({
        data: { codeId: code.id, userId, premiumUntil },
      });
      return describePlan(updated);
    });
  }

  /** days = null gives Premium with no end date */
  async grantPremium(userId: string, days: number | null) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { plan: true, premiumUntil: true },
    });
    if (!user) throw new NotFoundException("User not found");
    const updated = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        plan: "PREMIUM",
        premiumUntil: days == null ? null : extendPremium(user, days),
      },
      select: { plan: true, premiumUntil: true },
    });
    return describePlan(updated);
  }

  async revokePremium(userId: string) {
    const updated = await this.prismaService.user.update({
      where: { id: userId },
      data: { plan: "FREE", premiumUntil: null },
      select: { plan: true, premiumUntil: true },
    });
    return describePlan(updated);
  }

  /* ── referral codes (admin) ─────────────────────────────── */

  listCodes() {
    return this.prismaService.referralCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true } },
        redemptions: {
          orderBy: { redeemedAt: "desc" },
          take: 5,
          select: {
            redeemedAt: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  async createCode(adminId: string, input: CreateReferralCodeInput) {
    const code = input.code ? normalizeCode(input.code) : generateCode();
    if (!/^[A-Z0-9-]{4,32}$/.test(code))
      throw new BadRequestException(
        "Codes use 4-32 letters, numbers or dashes.",
      );
    const exists = await this.prismaService.referralCode.findUnique({
      where: { code },
    });
    if (exists) throw new ConflictException("This code already exists.");

    return this.prismaService.referralCode.create({
      data: {
        code,
        label: input.label?.trim() || null,
        premiumDays: input.premiumDays ?? 30,
        maxUses: input.maxUses ?? null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        createdByUserId: adminId,
      },
    });
  }

  async setCodeActive(id: string, active: boolean) {
    return this.prismaService.referralCode.update({
      where: { id },
      data: { active },
    });
  }

  async deleteCode(id: string) {
    await this.prismaService.referralCode.delete({ where: { id } });
    return { id };
  }

  /* ── admin overview ─────────────────────────────────────── */

  async overview() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
    const since = new Date(now.getTime() - 13 * DAY_MS);
    since.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      newThisWeek,
      activeThisWeek,
      premiumActive,
      premiumExpired,
      roles,
      trips,
      activeCodes,
      redemptions,
      recentSignups,
    ] = await Promise.all([
      this.prismaService.user.count(),
      this.prismaService.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prismaService.user.count({
        where: { lastSeenAt: { gte: weekAgo } },
      }),
      this.prismaService.user.count({
        where: {
          plan: "PREMIUM",
          OR: [{ premiumUntil: null }, { premiumUntil: { gt: now } }],
        },
      }),
      this.prismaService.user.count({
        where: { plan: "PREMIUM", premiumUntil: { lte: now } },
      }),
      this.prismaService.user.groupBy({ by: ["role"], _count: { _all: true } }),
      this.prismaService.trip.count(),
      this.prismaService.referralCode.count({ where: { active: true } }),
      this.prismaService.referralRedemption.count(),
      this.prismaService.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);

    const signupsByDay = Array.from({ length: 14 }, (_, index) => {
      const day = new Date(since.getTime() + index * DAY_MS);
      const next = new Date(day.getTime() + DAY_MS);
      return {
        date: day.toISOString().slice(0, 10),
        count: recentSignups.filter(
          (user) => user.createdAt >= day && user.createdAt < next,
        ).length,
      };
    });

    return {
      totalUsers,
      newThisWeek,
      activeThisWeek,
      premiumActive,
      premiumExpired,
      freeUsers: totalUsers - premiumActive,
      roles: Object.fromEntries(
        roles.map((entry) => [entry.role, entry._count._all]),
      ),
      trips,
      activeCodes,
      redemptions,
      signupsByDay,
    };
  }

  /** Users with plan, activity and trip counts for the admin table */
  async listUsers() {
    const now = new Date();
    const users = await this.prismaService.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        authMethod: true,
        plan: true,
        premiumUntil: true,
        lastSeenAt: true,
        createdAt: true,
        _count: { select: { tripsOwned: true, referralRedemptions: true } },
      },
    });
    return users.map(({ _count, plan, premiumUntil, ...user }) => ({
      ...user,
      ...describePlan({ plan, premiumUntil }, now),
      trips: _count.tripsOwned,
      codesUsed: _count.referralRedemptions,
    }));
  }
}
