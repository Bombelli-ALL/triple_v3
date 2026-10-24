import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { GamificationService } from "./gamification.service";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar: string | null;
  totalScore: number;
  totalXp: number;
  level: number;
  label: string;
  groupsCreated: number;
  groupsJoined: number;
}

type ScoredUser = Awaited<
  ReturnType<GamificationService["scoreUsers"]>
>[number];

const XP_PER_LEVEL = 80;
const TOP_N = 50;

/** Rankings from real quest XP; ties share a rank (1, 1, 3…) */
@Injectable()
export class LeaderboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
  ) {}

  private rank(users: ScoredUser[], currentUserId: string) {
    const sorted = [...users].sort(
      (a, b) =>
        b.xp - a.xp ||
        a.createdAt.getTime() - b.createdAt.getTime() ||
        a.name.localeCompare(b.name),
    );

    let previousXp: number | null = null;
    let previousRank = 0;
    const ranked: LeaderboardEntry[] = sorted.map((user, index) => {
      const rank = user.xp === previousXp ? previousRank : index + 1;
      previousXp = user.xp;
      previousRank = rank;
      return {
        rank,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatarUrl,
        totalScore: user.xp,
        totalXp: user.xp,
        level: 1 + Math.floor(user.xp / XP_PER_LEVEL),
        label: user.label,
        groupsCreated: user.groupsCreated,
        groupsJoined: user.groupsJoined,
      };
    });

    const me = ranked.find((entry) => entry.userId === currentUserId);
    return {
      leaderboard: ranked.slice(0, TOP_N),
      user: me
        ? { rank: me.rank, xp: me.totalXp, total: ranked.length }
        : { rank: null, xp: 0, total: ranked.length },
    };
  }

  async getGlobalLeaderboard(userId: string) {
    return this.rank(await this.gamificationService.scoreUsers(), userId);
  }

  /** People who share at least one travel group with the user, plus the user */
  async getFriendsLeaderboard(userId: string) {
    const memberships = await this.prisma.groupMembership.findMany({
      where: { userId, status: "MEMBER" },
      select: { groupId: true },
    });
    const owned = await this.prisma.group.findMany({
      where: { ownerUserId: userId },
      select: { id: true },
    });
    const groupIds = [
      ...memberships.map((entry) => entry.groupId),
      ...owned.map((group) => group.id),
    ];

    const [mates, owners] = await Promise.all([
      this.prisma.groupMembership.findMany({
        where: { groupId: { in: groupIds }, status: "MEMBER" },
        select: { userId: true },
      }),
      this.prisma.group.findMany({
        where: { id: { in: groupIds } },
        select: { ownerUserId: true },
      }),
    ]);
    const friendIds = new Set([
      userId,
      ...mates.map((entry) => entry.userId),
      ...owners.map((group) => group.ownerUserId),
    ]);

    const users = await this.gamificationService.scoreUsers();
    return this.rank(
      users.filter((user) => friendIds.has(user.id)),
      userId,
    );
  }

  /** Travelers heading to the same city as the user (chosen destination or a saved trip) */
  async getCityLeaderboard(userId: string, cityName?: string) {
    const users = await this.gamificationService.scoreUsers();
    const city = (
      cityName ??
      users.find((user) => user.id === userId)?.city ??
      ""
    ).toLowerCase();
    const sameCity = users.filter(
      (user) =>
        user.id === userId ||
        user.city.toLowerCase() === city ||
        user.tripCities.some((name) => name.toLowerCase() === city),
    );
    return { ...this.rank(sameCity, userId), city: city || null };
  }
}
