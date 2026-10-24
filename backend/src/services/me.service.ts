import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { UpdatePreferencesDto } from "@/public/dto/me/update-preferences.dto";
import { CityPlacesService } from "./city-places.service";
import {
  asRecord,
  readTravelPreferences,
  type TravelPreferences,
} from "@/common/travel-preferences";

@Injectable()
export class MeService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cityPlacesService: CityPlacesService,
  ) {}

  async getPreferences(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    if (!user) throw new NotFoundException("User not found");
    return readTravelPreferences(user.preferences);
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    // Any real Moroccan city works: create it and load its real places on first use
    const knownCity = await this.cityPlacesService.ensureCity(dto.city);
    if (knownCity) await this.cityPlacesService.ensurePlaces(knownCity);
    const preferences: TravelPreferences = {
      city: knownCity?.name ?? dto.city.trim(),
      durationDays: dto.durationDays,
      budgetDh: dto.budgetDh ?? null,
      adults: dto.adults,
      children: dto.children,
      interests: dto.interests ?? [],
    };
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    if (!user) throw new NotFoundException("User not found");
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        preferences: { ...asRecord(user.preferences), travel: preferences },
      },
    });
    return preferences;
  }

  /** Everything the traveler dashboard shows, computed from the user's real data */
  async getDashboard(userId: string) {
    const preferences = await this.getPreferences(userId);
    const city = preferences
      ? await this.cityPlacesService.ensureCity(preferences.city)
      : null;
    if (city) await this.cityPlacesService.ensurePlaces(city);

    const [trips, groupCount, bookings] = await Promise.all([
      this.prismaService.trip.findMany({
        where: { ownerUserId: userId },
        orderBy: { createdAt: "desc" },
        include: {
          city: { select: { id: true, name: true } },
          items: { orderBy: [{ day: "asc" }, { title: "asc" }] },
        },
      }),
      this.prismaService.groupMembership.count({
        where: { userId, status: "MEMBER" },
      }),
      this.prismaService.booking.findMany({
        where: { userId },
        select: { basePrice: true, status: true, currency: true },
      }),
    ]);

    const places = city
      ? await this.prismaService.attraction.findMany({
          where: { cityId: city.id },
          // Places with photos first so the dashboard looks complete
          orderBy: [
            { coverImage: { sort: "asc", nulls: "last" } },
            { name: "asc" },
          ],
          take: 30,
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            avgPrice: true,
            durationMinutes: true,
            coverImage: true,
            category: true,
          },
        })
      : [];

    // Prefer the newest trip to the chosen destination; otherwise the newest trip at all
    const destinationTrip = city
      ? trips.find((trip) => trip.cityId === city.id)
      : undefined;
    const latestTrip = destinationTrip ?? trips[0] ?? null;

    const plannedDays = trips.reduce((sum, trip) => {
      const days = new Set(trip.items.map((item) => item.day ?? 1)).size;
      return sum + days;
    }, 0);
    const bookedTotal = bookings
      .filter((booking) => booking.status !== "CANCELED")
      .reduce((sum, booking) => sum + Number(booking.basePrice), 0);

    return {
      preferences,
      city,
      stats: {
        trips: trips.length,
        plannedDays,
        groups: groupCount,
        bookings: bookings.length,
        bookedTotal,
      },
      latestTrip: latestTrip
        ? {
            id: latestTrip.id,
            title: latestTrip.title,
            description: latestTrip.description,
            city: latestTrip.city?.name ?? null,
            matchesDestination: Boolean(destinationTrip),
            budgetTotal:
              latestTrip.budgetTotal == null
                ? null
                : Number(latestTrip.budgetTotal),
            currency: latestTrip.currency,
            createdAt: latestTrip.createdAt,
            items: latestTrip.items.map((item) => ({
              id: item.id,
              day: item.day ?? 1,
              title: item.title,
              type: item.type,
              location: item.location,
            })),
          }
        : null,
      places: places.map((place) => ({
        ...place,
        avgPrice: place.avgPrice == null ? null : Number(place.avgPrice),
      })),
    };
  }
}
