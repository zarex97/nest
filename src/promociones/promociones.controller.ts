// promociones.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { UserRole } from "src/users/entities/user.entity";
import { PromocionesService, PromocionFilter } from "./promociones.service";
import { CreatePromocionDto } from "./dtos/create-promocion.dto";
import {
  Promocion,
  EstadoPromocion,
  TipoPromocion,
} from "./entities/promocion.entity";

@ApiTags("Promociones")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Controller("promociones")
export class PromocionesController {
  constructor(private readonly promocionesService: PromocionesService) {}

  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: "Crear nueva promoción (Solo Admin)" })
  @ApiResponse({
    status: 201,
    description: "Promoción creada exitosamente",
    type: Promocion,
  })
  async create(
    @Body() createPromocionDto: CreatePromocionDto
  ): Promise<Promocion> {
    return await this.promocionesService.create(createPromocionDto);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Empleado)
  @ApiOperation({ summary: "Listar promociones con filtros" })
  @ApiQuery({ name: "estado", required: false, enum: EstadoPromocion })
  @ApiQuery({ name: "tipo", required: false, enum: TipoPromocion })
  @ApiQuery({ name: "activas", required: false, type: Boolean })
  @ApiQuery({ name: "soloMayoristas", required: false, type: Boolean })
  async findAll(@Query() filters: PromocionFilter): Promise<Promocion[]> {
    return await this.promocionesService.findAll(filters);
  }

  @Get("activas")
  @ApiOperation({ summary: "Obtener promociones activas (público)" })
  async findActivas(): Promise<Promocion[]> {
    return await this.promocionesService.findAll({ activas: true });
  }

  @Get(":id")
  @Roles(UserRole.Admin, UserRole.Empleado)
  @ApiOperation({ summary: "Obtener promoción por ID" })
  @ApiParam({ name: "id", type: Number })
  async findOne(@Param("id", ParseIntPipe) id: number): Promise<Promocion> {
    return await this.promocionesService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: "Actualizar promoción (Solo Admin)" })
  @ApiParam({ name: "id", type: Number })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: Partial<CreatePromocionDto>
  ): Promise<Promocion> {
    return await this.promocionesService.update(id, updateDto);
  }

  @Delete(":id")
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: "Eliminar promoción (Solo Admin)" })
  @ApiParam({ name: "id", type: Number })
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return await this.promocionesService.remove(id);
  }

  @Patch(":id/activar")
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: "Activar promoción" })
  @ApiParam({ name: "id", type: Number })
  async activar(@Param("id", ParseIntPipe) id: number): Promise<Promocion> {
    return await this.promocionesService.activar(id);
  }

  @Patch(":id/desactivar")
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: "Desactivar promoción" })
  @ApiParam({ name: "id", type: Number })
  async desactivar(@Param("id", ParseIntPipe) id: number): Promise<Promocion> {
    return await this.promocionesService.desactivar(id);
  }
}
