import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class UpdateUserPlanDto {
  @IsIn(["grant", "revoke"])
  action: "grant" | "revoke";

  /** Days of Premium to add; omit or null for no end date */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3650)
  days?: number | null;
}

export class CreateReferralCodeDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3650)
  premiumDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  maxUses?: number | null;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  /** Custom code; a random TRIP-XXXX-XXXX is generated when omitted */
  @IsOptional()
  @IsString()
  @MaxLength(32)
  code?: string;
}

export class UpdateReferralCodeDto {
  @IsBoolean()
  active: boolean;
}
