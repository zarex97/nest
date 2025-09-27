import { registerAs } from "@nestjs/config";
import { MailerConfig } from "./config.type";
import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  IsEmail,
} from "class-validator";
import validateConfig from "src/utils/validate-config";

class EnvironmentVariablesValidator {
  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  MAILER_PORT: number;

  @IsString()
  @IsOptional() // Make host optional
  MAILER_HOST: string;

  @IsString()
  @IsOptional()
  MAILER_USER: string;

  @IsString()
  @IsOptional()
  MAILER_PASSWORD: string;

  @IsEmail()
  @IsOptional() // Make email optional for development
  MAILER_DEFAULT_EMAIL: string;

  @IsString()
  @IsOptional() // Make name optional - this was the main issue
  MAILER_DEFAULT_NAME: string;

  @IsBoolean()
  @IsOptional()
  MAILER_IGNORE_TLS: boolean;

  @IsBoolean()
  @IsOptional()
  MAILER_SECURE: boolean;

  @IsBoolean()
  @IsOptional()
  MAILER_REQUIRE_TLS: boolean;
}

export default registerAs<MailerConfig>("mailer", () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  const config = {
    port: process.env.MAILER_PORT
      ? parseInt(process.env.MAILER_PORT, 10)
      : 1025, // Change default to 1025
    host: process.env.MAILER_HOST || "localhost",
    user: process.env.MAILER_USER || undefined,
    password: process.env.MAILER_PASSWORD || undefined,
    defaultEmail: process.env.MAILER_DEFAULT_EMAIL || "noreply@example.com",
    defaultName: process.env.MAILER_DEFAULT_NAME || "Sublimación API", // Provide default
    ignoreTLS: process.env.MAILER_IGNORE_TLS === "true",
    secure: process.env.MAILER_SECURE === "true",
    requireTLS: process.env.MAILER_REQUIRE_TLS === "true",
  };

  // Temporary debug logging
  console.log("📧 Mailer Config Loaded:", {
    host: config.host,
    port: config.port,
    defaultEmail: config.defaultEmail,
    defaultName: config.defaultName,
  });

  return config;
});
