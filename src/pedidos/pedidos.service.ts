// pedidos.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, Between } from "typeorm";
import {
  Pedido,
  EstadoPedido,
  PrioridadPedido,
} from "./entities/pedido.entity";
import {
  DetallePedido,
  EstadoProduccion,
} from "./entities/detalle-pedido.entity";
import {
  Transaccion,
  MetodoTransaccion,
  EstadoTransaccion,
} from "./entities/transaccion.entity";

export interface PedidoFilter {
  estado?: EstadoPedido;
  fechaDesde?: Date;
  fechaHasta?: Date;
  clienteId?: number;
  empleadoId?: number;
  soloUrgentes?: boolean;
  page?: number;
  limit?: number;
}

export interface EstadisticasPedidos {
  totalPedidos: number;
  pedidosPendientes: number;
  pedidosEnProduccion: number;
  pedidosTerminados: number;
  ventasTotales: number;
  ventasDelMes: number;
  promedioTiempoProduccion: number;
}

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private pedidosRepository: Repository<Pedido>,
    @InjectRepository(DetallePedido)
    private detallesRepository: Repository<DetallePedido>,
    @InjectRepository(Transaccion)
    private transaccionesRepository: Repository<Transaccion>
  ) {}

  // CRUD Pedidos
  async findAll(filters: PedidoFilter = {}): Promise<{
    pedidos: Pedido[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, ...otherFilters } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.pedidosRepository
      .createQueryBuilder("pedido")
      .leftJoinAndSelect("pedido.cliente", "cliente")
      .leftJoinAndSelect("pedido.empleadoAtencion", "empleado")
      .leftJoinAndSelect("pedido.detalles", "detalles")
      .leftJoinAndSelect("detalles.producto", "producto")
      .leftJoinAndSelect("detalles.talla", "talla")
      .leftJoinAndSelect("pedido.transacciones", "transacciones");

    // Aplicar filtros
    if (otherFilters.estado) {
      queryBuilder.andWhere("pedido.estado = :estado", {
        estado: otherFilters.estado,
      });
    }

    if (otherFilters.clienteId) {
      queryBuilder.andWhere("pedido.clienteId = :clienteId", {
        clienteId: otherFilters.clienteId,
      });
    }

    if (otherFilters.empleadoId) {
      queryBuilder.andWhere("pedido.empleadoAtencionId = :empleadoId", {
        empleadoId: otherFilters.empleadoId,
      });
    }

    if (otherFilters.soloUrgentes) {
      queryBuilder.andWhere("pedido.prioridad IN (:...prioridades)", {
        prioridades: [PrioridadPedido.Urgente, PrioridadPedido.Express],
      });
    }

    if (otherFilters.fechaDesde && otherFilters.fechaHasta) {
      queryBuilder.andWhere(
        "pedido.fechaPedido BETWEEN :fechaDesde AND :fechaHasta",
        {
          fechaDesde: otherFilters.fechaDesde,
          fechaHasta: otherFilters.fechaHasta,
        }
      );
    }

    const total = await queryBuilder.getCount();

    const pedidos = await queryBuilder
      .orderBy("pedido.fechaPedido", "DESC")
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      pedidos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Pedido> {
    const pedido = await this.pedidosRepository.findOne({
      where: { id },
      relations: [
        "cliente",
        "empleadoAtencion",
        "detalles",
        "detalles.producto",
        "detalles.talla",
        "detalles.personalizacion",
        "transacciones",
        "transacciones.recibidoPor",
      ],
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    return pedido;
  }

  async updateEstado(id: number, nuevoEstado: EstadoPedido): Promise<Pedido> {
    const pedido = await this.findOne(id);

    // Validar transiciones de estado
    if (!this.esTransicionValida(pedido.estado, nuevoEstado)) {
      throw new BadRequestException(
        `No se puede cambiar de ${pedido.estado} a ${nuevoEstado}`
      );
    }

    pedido.estado = nuevoEstado;

    // Lógica adicional según el estado
    if (nuevoEstado === EstadoPedido.EnProduccion) {
      await this.iniciarProduccion(pedido);
    } else if (nuevoEstado === EstadoPedido.Entregado) {
      pedido.fechaEntregaReal = new Date();
    }

    return await this.pedidosRepository.save(pedido);
  }

  async updateEstadoProduccion(
    pedidoId: number,
    detalleId: number,
    nuevoEstado: EstadoProduccion,
    notas?: string
  ): Promise<DetallePedido> {
    const detalle = await this.detallesRepository.findOne({
      where: { id: detalleId, pedidoId },
      relations: ["pedido"],
    });

    if (!detalle) {
      throw new NotFoundException("Detalle de pedido no encontrado");
    }

    detalle.estadoProduccion = nuevoEstado;
    if (notas) {
      detalle.notas = notas;
    }

    if (nuevoEstado === EstadoProduccion.Diseno) {
      detalle.fechaInicioProduccion = new Date();
    } else if (nuevoEstado === EstadoProduccion.Terminado) {
      detalle.fechaFinProduccion = new Date();
    }

    const detalleActualizado = await this.detallesRepository.save(detalle);

    // Verificar si todos los detalles están terminados
    await this.verificarEstadoPedidoCompleto(pedidoId);

    return detalleActualizado;
  }

  // Gestión de Pagos
  async registrarPago(
    pedidoId: number,
    monto: number,
    metodo: MetodoTransaccion,
    empleadoId: number,
    notas?: string,
    esSena: boolean = false
  ): Promise<Transaccion> {
    const pedido = await this.findOne(pedidoId);

    // Validar monto
    const saldoPendiente = pedido.getSaldoPendiente();
    if (!esSena && monto > saldoPendiente) {
      throw new BadRequestException("El monto excede el saldo pendiente");
    }

    const transaccion = this.transaccionesRepository.create({
      pedidoId,
      monto,
      metodo,
      estado: EstadoTransaccion.Completada,
      recibidoPorId: empleadoId,
      notas,
      esSena,
    });

    const transaccionGuardada =
      await this.transaccionesRepository.save(transaccion);

    // Actualizar pedido
    if (esSena) {
      pedido.sena = monto;
    } else {
      const nuevoSaldoPendiente = saldoPendiente - monto;
      if (nuevoSaldoPendiente <= 0) {
        pedido.pagado = true;
        pedido.fechaPago = new Date();
      }
    }

    await this.pedidosRepository.save(pedido);

    return transaccionGuardada;
  }

  // Estadísticas
  async getEstadisticas(): Promise<EstadisticasPedidos> {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const finMes = new Date();
    finMes.setMonth(finMes.getMonth() + 1);
    finMes.setDate(0);
    finMes.setHours(23, 59, 59, 999);

    const [
      totalPedidos,
      pedidosPendientes,
      pedidosEnProduccion,
      pedidosTerminados,
      ventasTotales,
      ventasDelMes,
    ] = await Promise.all([
      this.pedidosRepository.count(),
      this.pedidosRepository.count({
        where: { estado: EstadoPedido.Pendiente },
      }),
      this.pedidosRepository.count({
        where: { estado: EstadoPedido.EnProduccion },
      }),
      this.pedidosRepository.count({
        where: { estado: EstadoPedido.Terminado },
      }),
      this.pedidosRepository
        .createQueryBuilder("pedido")
        .select("SUM(pedido.total)", "total")
        .where("pedido.estado != :estado", { estado: EstadoPedido.Cancelado })
        .getRawOne()
        .then((result) => parseFloat(result.total) || 0),
      this.pedidosRepository
        .createQueryBuilder("pedido")
        .select("SUM(pedido.total)", "total")
        .where("pedido.fechaPedido BETWEEN :inicio AND :fin", {
          inicio: inicioMes,
          fin: finMes,
        })
        .andWhere("pedido.estado != :estado", {
          estado: EstadoPedido.Cancelado,
        })
        .getRawOne()
        .then((result) => parseFloat(result.total) || 0),
    ]);

    // Calcular promedio tiempo de producción (días)
    const pedidosConTiempos = await this.pedidosRepository
      .createQueryBuilder("pedido")
      .select(
        "AVG(DATEDIFF(pedido.fechaEntregaReal, pedido.fechaPedido))",
        "promedio"
      )
      .where("pedido.fechaEntregaReal IS NOT NULL")
      .getRawOne();

    const promedioTiempoProduccion =
      parseFloat(pedidosConTiempos.promedio) || 0;

    return {
      totalPedidos,
      pedidosPendientes,
      pedidosEnProduccion,
      pedidosTerminados,
      ventasTotales,
      ventasDelMes,
      promedioTiempoProduccion,
    };
  }

  // Métodos auxiliares privados
  private esTransicionValida(
    estadoActual: EstadoPedido,
    nuevoEstado: EstadoPedido
  ): boolean {
    const transicionesValidas: Record<EstadoPedido, EstadoPedido[]> = {
      [EstadoPedido.Cotizacion]: [
        EstadoPedido.Pendiente,
        EstadoPedido.Cancelado,
      ],
      [EstadoPedido.Pendiente]: [
        EstadoPedido.Confirmado,
        EstadoPedido.Cancelado,
      ],
      [EstadoPedido.Confirmado]: [
        EstadoPedido.EnProduccion,
        EstadoPedido.Cancelado,
      ],
      [EstadoPedido.EnProduccion]: [
        EstadoPedido.ControlCalidad,
        EstadoPedido.Cancelado,
      ],
      [EstadoPedido.ControlCalidad]: [
        EstadoPedido.Terminado,
        EstadoPedido.EnProduccion,
      ],
      [EstadoPedido.Terminado]: [EstadoPedido.ListoRetiro],
      [EstadoPedido.ListoRetiro]: [EstadoPedido.Entregado],
      [EstadoPedido.Entregado]: [],
      [EstadoPedido.Cancelado]: [],
    };

    return transicionesValidas[estadoActual]?.includes(nuevoEstado) || false;
  }

  private async iniciarProduccion(pedido: Pedido): Promise<void> {
    for (const detalle of pedido.detalles) {
      if (detalle.estadoProduccion === EstadoProduccion.Pendiente) {
        detalle.iniciarProduccion();
        await this.detallesRepository.save(detalle);
      }
    }
  }

  private async verificarEstadoPedidoCompleto(pedidoId: number): Promise<void> {
    const detalles = await this.detallesRepository.find({
      where: { pedidoId },
    });

    const todosTerminados = detalles.every(
      (detalle) => detalle.estadoProduccion === EstadoProduccion.Terminado
    );

    if (todosTerminados) {
      const pedido = await this.pedidosRepository.findOne({
        where: { id: pedidoId },
      });

      if (pedido && pedido.estado === EstadoPedido.EnProduccion) {
        pedido.estado = EstadoPedido.ControlCalidad;
        await this.pedidosRepository.save(pedido);
      }
    }
  }
}
