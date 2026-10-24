import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  preferences?: Record<string, unknown>;

  // Public sign-up can only create travelers or guides; admins are promoted by an admin
  @IsOptional()
  @IsIn(["TRAVELER", "GUIDE"])
  role?: "TRAVELER" | "GUIDE";

  @IsOptional()
  @IsString()
  @MaxLength(40)
  referralCode?: string;
}
