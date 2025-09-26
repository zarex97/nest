import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  Body,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { User, UserRole } from "./entities/user.entity";
import { Roles } from "src/auth/decorators/roles.decorator";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { ApiBearerAuth, ApiTags, ApiParam, ApiBody } from "@nestjs/swagger";

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), RolesGuard) // Aplicar ambos guards
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.Admin) // Solo administradores
  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAllUsers();
  }

  @Roles(UserRole.Admin)
  @Get(":id")
  @ApiParam({ name: "id", type: Number, example: 1 })
  async findOne(@Param("id") id: string): Promise<User> {
    return this.usersService.findOneUser({ id: +id });
  }

  @Roles(UserRole.Admin)
  @Patch(":id/role")
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: "id", type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        role: {
          type: "string",
          enum: Object.values(UserRole),
          example: UserRole.Admin,
        },
      },
    },
  })
  async updateRole(
    @Param("id") id: string,
    @Body("role") role: UserRole
  ): Promise<User> {
    // Validar que el rol es válido
    if (!Object.values(UserRole).includes(role)) {
      throw new Error("Invalid role");
    }
    return this.usersService.updateUserRole(+id, role);
  }

  @Roles(UserRole.Admin)
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
