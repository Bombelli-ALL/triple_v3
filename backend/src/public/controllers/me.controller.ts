import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@/auth/auth.guard";
import { MeService } from "@/services/me.service";
import { UpdatePreferencesDto } from "@/public/dto/me/update-preferences.dto";
import { RedeemCodeDto } from "@/public/dto/me/redeem-code.dto";
import { PlanService } from "@/services/plan.service";

type AuthedRequest = { user?: { id?: string } };

function requireUserId(req: AuthedRequest) {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedException("User not authenticated");
  return userId;
}

/** The logged-in traveler: preferences, dashboard and plan (GET /api/me/plan, POST /api/me/plan/redeem) */
@UseGuards(AuthGuard)
@Controller("me")
export class MeController {
  constructor(
    private readonly meService: MeService,
    private readonly planService: PlanService,
  ) {}

  @Get("preferences")
  getPreferences(@Req() req: AuthedRequest) {
    return this.meService.getPreferences(requireUserId(req));
  }

  @Put("preferences")
  updatePreferences(
    @Req() req: AuthedRequest,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.meService.updatePreferences(requireUserId(req), dto);
  }

  @Get("dashboard")
  getDashboard(@Req() req: AuthedRequest) {
    return this.meService.getDashboard(requireUserId(req));
  }

  @Get("plan")
  getPlan(@Req() req: AuthedRequest) {
    return this.planService.getPlan(requireUserId(req));
  }

  @Post("plan/redeem")
  redeem(@Req() req: AuthedRequest, @Body() dto: RedeemCodeDto) {
    return this.planService.redeem(requireUserId(req), dto.code);
  }
}
