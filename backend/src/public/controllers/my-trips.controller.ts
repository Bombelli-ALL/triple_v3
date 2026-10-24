import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@/auth/auth.guard";
import { MyTripsService } from "@/services/my-trips.service";
import { SaveMyTripDto } from "@/public/dto/trip/save-my-trip.dto";

type AuthedRequest = { user?: { id?: string } };

function requireUserId(req: AuthedRequest) {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedException("User not authenticated");
  return userId;
}

/** Trips owned by the logged-in user: GET/POST /api/me/trips, DELETE /api/me/trips/:id */
@UseGuards(AuthGuard)
@Controller("me/trips")
export class MyTripsController {
  constructor(private readonly myTripsService: MyTripsService) {}

  @Get()
  findAll(@Req() req: AuthedRequest) {
    return this.myTripsService.findAll(requireUserId(req));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: AuthedRequest, @Body() dto: SaveMyTripDto) {
    return this.myTripsService.create(requireUserId(req), dto);
  }

  @Delete(":id")
  remove(
    @Req() req: AuthedRequest,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.myTripsService.remove(requireUserId(req), id);
  }
}
