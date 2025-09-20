import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  Body,
  Inject,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { Services } from "src/utils/constants";
import { IUsersService } from "./users"; // Interface
import { User } from "./entities/user.entity";
import { Roles } from "src/auth/decorators/roles.decorator";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags, ApiParam, ApiBody } from "@nestjs/swagger";

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt")) // 👈 Still need JWT auth
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Roles("admin") // 👈 Only admins
  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAllUsers();
  }

  @Roles("admin")
  @Get(":id")
  @ApiParam({ name: "id", type: Number, example: 1 })
  async findOne(@Param("id") id: string): Promise<User> {
    return this.usersService.findOneUser({ id: +id });
  }

  @Roles("admin")
  @Patch(":id/role")
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: "id", type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        role: {
          type: "string",
          enum: ["admin", "cliente", "empleado", "diseñador"],
          example: "admin",
        },
      },
    },
  })
  async updateRole(
    @Param("id") id: string,
    @Body("role") role: string
  ): Promise<User> {
    if (!["admin", "cliente", "empleado", "diseñador"].includes(role)) {
      throw new Error("Invalid role");
    }
    return this.usersService.updateUserRole(+id, role);
  }

  @Roles("admin")
  @Patch(":id/status")
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: "id", type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["active", "inactive"],
          example: "active",
        },
      },
    },
  })
  async updateStatus(
    @Param("id") id: string,
    @Body("status") status: "active" | "inactive"
  ): Promise<User> {
    return this.usersService.updateUserStatus(+id, status);
  }
}
