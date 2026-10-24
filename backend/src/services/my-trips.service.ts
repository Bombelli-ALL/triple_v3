import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { SaveMyTripDto } from "@/public/dto/trip/save-my-trip.dto";
import { findCityByName } from "@/common/city-lookup";

const tripInclude = {
  city: true,
  items: { orderBy: [{ day: "asc" }, { title: "asc" }] },
} satisfies Prisma.TripInclude;

@Injectable()
export class MyTripsService {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(userId: string) {
    return this.prismaService.trip.findMany({
      where: { ownerUserId: userId },
      orderBy: { createdAt: "desc" },
      include: tripInclude,
    });
  }

  async create(userId: string, dto: SaveMyTripDto) {
    if (
      dto.startDate &&
      dto.endDate &&
      new Date(dto.endDate) < new Date(dto.startDate)
    ) {
      throw new BadRequestException("endDate must be after startDate");
    }

    const city = dto.cityName?.trim()
      ? await findCityByName(this.prismaService, dto.cityName)
      : null;

    return this.prismaService.trip.create({
      data: {
        ownerUserId: userId,
        title: dto.title,
        description: dto.description,
        cityId: city?.id,
        status: "ACTIVE",
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        budgetTotal: dto.budgetTotal,
        currency: dto.currency ?? "MAD",
        plan: dto.plan as Prisma.InputJsonValue | undefined,
        items: dto.items?.length
          ? {
              create: dto.items.map((item) => ({
                day: item.day,
                title: item.title,
                location: item.location,
                notes: item.notes,
                type: item.type,
              })),
            }
          : undefined,
      },
      include: tripInclude,
    });
  }

  async remove(userId: string, tripId: string) {
    const { count } = await this.prismaService.trip.deleteMany({
      where: { id: tripId, ownerUserId: userId },
    });
    if (!count) throw new NotFoundException("Trip not found");
    return { id: tripId };
  }
}
