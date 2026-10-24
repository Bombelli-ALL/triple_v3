import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

/** What a traveler wants: drives their dashboard, budget split and generated plan */
export class UpdatePreferencesDto {
  @IsString()
  @MaxLength(100)
  city: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  durationDays: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetDh?: number | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  adults: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  children: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  interests?: string[];
}
