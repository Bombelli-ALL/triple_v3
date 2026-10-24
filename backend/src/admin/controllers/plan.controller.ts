import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@/auth/auth.guard";
import { RoleGuard } from "@/auth/role.guard";
import { PlanService } from "@/services/plan.service";
import { CityPlacesService } from "@/services/city-places.service";
import {
  CreateReferralCodeDto,
  UpdateReferralCodeDto,
  UpdateUserPlanDto,
} from "../dto/plan/admin-plan.dto";

/** Admin view of users, plans and referral codes */
@UseGuards(AuthGuard, RoleGuard(["admin"]))
@Controller("admin")
export class AdminPlanController {
  constructor(
    private readonly planService: PlanService,
    private readonly cityPlacesService: CityPlacesService,
  ) {}

  @Get("overview")
  overview() {
    return this.planService.overview();
  }

  /** Cities with how many real places each one has */
  @Get("city-coverage")
  cityCoverage() {
    return this.cityPlacesService.listCityCoverage();
  }

  /** Loads every Moroccan city with real places in the background */
  @Post("city-sync")
  startCitySync() {
    return this.cityPlacesService.startSyncAll();
  }

  @Get("city-sync")
  citySyncStatus() {
    return this.cityPlacesService.getSyncStatus();
  }

  @Get("members")
  members() {
    return this.planService.listUsers();
  }

  @Patch("users/:id/plan")
  updatePlan(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserPlanDto,
  ) {
    return dto.action === "grant"
      ? this.planService.grantPremium(id, dto.days ?? null)
      : this.planService.revokePremium(id);
  }

  @Get("referral-codes")
  listCodes() {
    return this.planService.listCodes();
  }

  @Post("referral-codes")
  createCode(
    @Req() req: { user?: { id?: string } },
    @Body() dto: CreateReferralCodeDto,
  ) {
    if (!req.user?.id) throw new UnauthorizedException();
    return this.planService.createCode(req.user.id, dto);
  }

  @Patch("referral-codes/:id")
  updateCode(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateReferralCodeDto,
  ) {
    return this.planService.setCodeActive(id, dto.active);
  }

  @Delete("referral-codes/:id")
  deleteCode(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.planService.deleteCode(id);
  }
}
