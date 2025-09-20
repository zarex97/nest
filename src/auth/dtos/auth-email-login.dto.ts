import { IsEmail, IsNotEmpty } from "class-validator";
import { Transform } from "class-transformer";
import { lowerCaseTransformer } from "src/utils/transformers/lower-case.transformer";
import { ApiProperty } from "@nestjs/swagger";

export class AuthEmailLoginDto {
  @ApiProperty({ example: "ramez@gmail.com" })
  @Transform(lowerCaseTransformer)
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;
}
