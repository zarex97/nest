import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Request,
  Post,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { UserRole } from "src/users/entities/user.entity";
import {
  PedidosService,
  PedidoFilter,
  EstadisticasPedidos,
} from "./pedidos.service";
import { Pedido, EstadoPedido } from "./entities/pedido.entity";
import {
  DetallePedido,
  EstadoProduccion,
} from "./entities/detalle-pedido.entity";
import { Transaccion, MetodoTransaccion } from "./entities/transaccion.entity";
import { RequestWithUser } from "src/auth/types/request-with-user.type";

// DTOs para las operaciones
class UpdateEstadoPedidoDto {
  estado: EstadoPedido;
}

class UpdateEstadoProduccionDto {
  estado: EstadoProduccion;
  notas?: string;
}

class RegistrarPagoDto {
  monto: number;
  metodo: MetodoTransaccion;
  notas?: string;
  esSena?: boolean;
}

@ApiTags("Pedidos Admin")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Controller("admin/pedidos")
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Get()
  @Roles(UserRole.Admin, UserRole.Empleado)
  @ApiOperation({ summary: "Listar todos los pedidos con filtros" })
  @ApiQuery({ name: "estado", required: false, enum: EstadoPedido })
  @ApiQuery({
    name: "fechaDesde",
    required: false,
    type: String,
    example: "2024-01-01",
  })
  @ApiQuery({
    name: "fechaHasta",
    required: false,
    type: String,
    example: "2024-12-31",
  })
  @ApiQuery({ name: "clienteId", required: false, type: Number })
  @ApiQuery({ name: "empleadoId", required: false, type: Number })
  @ApiQuery({ name: "soloUrgentes", required: false, type: Boolean })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  async findAll(@Query() filters: PedidoFilter) {
    // Convertir fechas si están presentes
    if (filters.fechaDesde) {
      filters.fechaDesde = new Date(filters.fechaDesde as any);
    }
    if (filters.fechaHasta) {
      filters.fechaHasta = new Date(filters.fechaHasta as any);
    }

    return await this.pedidosService.findAll(filters);
  }

  @Get("estadisticas")
  @Roles(UserRole.Admin, UserRole.Empleado)
  @ApiOperation({ summary: "Obtener estadísticas de ventas y producción" })
  @ApiResponse({
    status: 200,
    description: "Estadísticas de pedidos",
    schema: {
      type: "object",
      properties: {
        totalPedidos: { type: "number" },
        pedidosPendientes: { type: "number" },
        pedidosEnProduccion: { type: "number" },
        pedidosTerminados: { type: "number" },
        ventasTotales: { type: "number" },
        ventasDelMes: { type: "number" },
        promedioTiempoProduccion: { type: "number" },
      },
    },
  })
  async getEstadisticas(): Promise<EstadisticasPedidos> {
    return await this.pedidosService.getEstadisticas();
  }

  @Get(":id")
  @Roles(UserRole.Admin, UserRole.Empleado)
  @ApiOperation({ summary: "Obtener pedido por ID con todos los detalles" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, description: "Pedido encontrado", type: Pedido })
  @ApiResponse({ status: 404, description: "Pedido no encontrado" })
  async findOne(@Param("id", ParseIntPipe) id: number): Promise<Pedido> {
    return await this.pedidosService.findOne(id);
  }

  @Patch(":id/estado")
  @Roles(UserRole.Admin, UserRole.Empleado)
  @ApiOperation({ summary: "Cambiar estado del pedido" })
  @ApiParam({ name: "id", type: Number })
  @ApiBody({
    schema: {
      type: "object",
      required: ["estado"],
      properties: {
        estado: {
          type: "string",
          enum: Object.values(EstadoPedido),
          example: EstadoPedido.Confirmado,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Estado actualizado exitosamente",
    type: Pedido,
  })
  async updateEstado(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateEstadoDto: UpdateEstadoPedidoDto
  ): Promise<Pedido> {
    return await this.pedidosService.updateEstado(id, updateEstadoDto.estado);
  }

  @Patch(":id/detalles/:detalleId/produccion")
  @Roles(UserRole.Admin, UserRole.Empleado, UserRole.Disenador)
  @ApiOperation({
    summary: "Actualizar estado de producción de un detalle específico",
  })
  @ApiParam({ name: "id", type: Number, description: "ID del pedido" })
  @ApiParam({ name: "detalleId", type: Number, description: "ID del detalle" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["estado"],
      properties: {
        estado: {
          type: "string",
          enum: Object.values(EstadoProduccion),
          example: EstadoProduccion.Impresion,
        },
        notas: {
          type: "string",
          example: "Iniciando proceso de impresión",
        },
      },
    },
  })
  async updateEstadoProduccion(
    @Param("id", ParseIntPipe) pedidoId: number,
    @Param("detalleId", ParseIntPipe) detalleId: number,
    @Body() updateDto: UpdateEstadoProduccionDto
  ): Promise<DetallePedido> {
    return await this.pedidosService.updateEstadoProduccion(
      pedidoId,
      detalleId,
      updateDto.estado,
      updateDto.notas
    );
  }

  @Post(":id/pagos")
  @Roles(UserRole.Admin, UserRole.Empleado)
  @ApiOperation({ summary: "Registrar pago de pedido" })
  @ApiParam({ name: "id", type: Number })
  @ApiBody({
    schema: {
      type: "object",
      required: ["monto", "metodo"],
      properties: {
        monto: {
          type: "number",
          example: 50000,
          description: "Monto del pago",
        },
        metodo: {
          type: "string",
          enum: Object.values(MetodoTransaccion),
          example: MetodoTransaccion.EfectivoLocal,
        },
        notas: {
          type: "string",
          example: "Pago recibido en efectivo",
        },
        esSena: {
          type: "boolean",
          example: false,
          description: "True si es seña, false si es pago completo",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Pago registrado exitosamente",
    type: Transaccion,
  })
  async registrarPago(
    @Param("id", ParseIntPipe) id: number,
    @Body() pagoDto: RegistrarPagoDto,
    @Request() req: RequestWithUser
  ): Promise<Transaccion> {
    return await this.pedidosService.registrarPago(
      id,
      pagoDto.monto,
      pagoDto.metodo,
      req.user.id,
      pagoDto.notas,
      pagoDto.esSena || false
    );
  }

  // Endpoints específicos para estados comunes
  @Patch(":id/confirmar")
  @Roles(UserRole.Admin, UserRole.Empleado)
  @ApiOperation({ summary: "Confirmar pedido (cambiar a confirmado)" })
  @ApiParam({ name: "id", type: Number })
  async confirmarPedido(
    @Param("id", ParseIntPipe) id: number
  ): Promise<Pedido> {
    return await this.pedidosService.updateEstado(id, EstadoPedido.Confirmado);
  }

  @Patch(":id/iniciar-produccion")
  @Roles(UserRole.Admin, UserRole.Empleado)
  @ApiOperation({ summary: "Iniciar producción del pedido" })
  @ApiParam({ name: "id", type: Number })
  async iniciarProduccion(
    @Param("id", ParseIntPipe) id: number
  ): Promise<Pedido> {
    return await this.pedidosService.updateEstado(
      id,
      EstadoPedido.EnProduccion
    );
  }

  @Patch(":id/marcar-terminado")
  @Roles(UserRole.Admin, UserRole.Empleado)
  @ApiOperation({ summary: "Marcar pedido como terminado" })
  @ApiParam({ name: "id", type: Number })
  async marcarTerminado(
    @Param("id", ParseIntPipe) id: number
  ): Promise<Pedido> {
    return await this.pedidosService.updateEstado(id, EstadoPedido.Terminado);
  }

  @Patch(":id/listo-retiro")
  @Roles(UserRole.Admin, UserRole.Empleado)
  @ApiOperation({ summary: "Marcar pedido listo para retiro" })
  @ApiParam({ name: "id", type: Number })
  async listoRetiro(@Param("id", ParseIntPipe) id: number): Promise<Pedido> {
    return await this.pedidosService.updateEstado(id, EstadoPedido.ListoRetiro);
  }

  @Patch(":id/entregar")
  @Roles(UserRole.Admin, UserRole.Empleado)
  @ApiOperation({ summary: "Marcar pedido como entregado" })
  @ApiParam({ name: "id", type: Number })
  async entregarPedido(@Param("id", ParseIntPipe) id: number): Promise<Pedido> {
    return await this.pedidosService.updateEstado(id, EstadoPedido.Entregado);
  }

  @Patch(":id/cancelar")
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: "Cancelar pedido (Solo Admin)" })
  @ApiParam({ name: "id", type: Number })
  async cancelarPedido(@Param("id", ParseIntPipe) id: number): Promise<Pedido> {
    return await this.pedidosService.updateEstado(id, EstadoPedido.Cancelado);
  }
}
