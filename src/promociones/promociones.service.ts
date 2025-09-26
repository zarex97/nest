// promociones.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThanOrEqual, MoreThanOrEqual, And } from "typeorm";
import {
  Promocion,
  EstadoPromocion,
  TipoPromocion,
} from "./entities/promocion.entity";
import { CreatePromocionDto } from "./dtos/create-promocion.dto";

export interface PromocionFilter {
  estado?: EstadoPromocion;
  tipo?: TipoPromocion;
  activas?: boolean;
  soloMayoristas?: boolean;
}

@Injectable()
export class PromocionesService {
  constructor(
    @InjectRepository(Promocion)
    private promocionesRepository: Repository<Promocion>
  ) {}

  async create(createPromocionDto: CreatePromocionDto): Promise<Promocion> {
    const fechaInicio = new Date(createPromocionDto.fechaInicio);
    const fechaFin = new Date(createPromocionDto.fechaFin);

    // Validaciones
    if (fechaFin <= fechaInicio) {
      throw new BadRequestException(
        "La fecha de fin debe ser posterior a la fecha de inicio"
      );
    }

    if (
      createPromocionDto.tipo === TipoPromocion.PorcentajeDescuento &&
      createPromocionDto.valor > 100
    ) {
      throw new BadRequestException(
        "El porcentaje de descuento no puede ser mayor a 100%"
      );
    }

    const promocion = this.promocionesRepository.create({
      ...createPromocionDto,
      fechaInicio,
      fechaFin,
      estado:
        fechaInicio <= new Date()
          ? EstadoPromocion.Activa
          : EstadoPromocion.Programada,
    });

    return await this.promocionesRepository.save(promocion);
  }

  async findAll(filters: PromocionFilter = {}): Promise<Promocion[]> {
    const queryBuilder =
      this.promocionesRepository.createQueryBuilder("promocion");

    if (filters.estado) {
      queryBuilder.andWhere("promocion.estado = :estado", {
        estado: filters.estado,
      });
    }

    if (filters.tipo) {
      queryBuilder.andWhere("promocion.tipo = :tipo", { tipo: filters.tipo });
    }

    if (filters.activas) {
      const ahora = new Date();
      queryBuilder
        .andWhere("promocion.estado = :estadoActiva", {
          estadoActiva: EstadoPromocion.Activa,
        })
        .andWhere("promocion.fechaInicio <= :ahora", { ahora })
        .andWhere("promocion.fechaFin >= :ahora", { ahora })
        .andWhere(
          "(promocion.limiteUsos IS NULL OR promocion.usosActuales < promocion.limiteUsos)"
        );
    }

    if (filters.soloMayoristas !== undefined) {
      queryBuilder.andWhere("promocion.soloMayoristas = :soloMayoristas", {
        soloMayoristas: filters.soloMayoristas,
      });
    }

    return await queryBuilder
      .orderBy("promocion.fechaCreacion", "DESC")
      .getMany();
  }

  async findOne(id: number): Promise<Promocion> {
    const promocion = await this.promocionesRepository.findOne({
      where: { id },
    });

    if (!promocion) {
      throw new NotFoundException(`Promoción con ID ${id} no encontrada`);
    }

    return promocion;
  }

  async update(
    id: number,
    updateDto: Partial<CreatePromocionDto>
  ): Promise<Promocion> {
    const promocion = await this.findOne(id);

    if (updateDto.fechaInicio) {
      updateDto.fechaInicio = new Date(updateDto.fechaInicio) as any;
    }
    if (updateDto.fechaFin) {
      updateDto.fechaFin = new Date(updateDto.fechaFin) as any;
    }

    Object.assign(promocion, updateDto);
    return await this.promocionesRepository.save(promocion);
  }

  async remove(id: number): Promise<void> {
    const promocion = await this.findOne(id);
    await this.promocionesRepository.remove(promocion);
  }

  async activar(id: number): Promise<Promocion> {
    const promocion = await this.findOne(id);
    promocion.activar();
    return await this.promocionesRepository.save(promocion);
  }

  async desactivar(id: number): Promise<Promocion> {
    const promocion = await this.findOne(id);
    promocion.desactivar();
    return await this.promocionesRepository.save(promocion);
  }

  async getPromocionesAplicables(
    productos: { id: number; categoriaId: number; cantidad: number }[],
    montoTotal: number,
    esMayorista: boolean = false
  ): Promise<Promocion[]> {
    const promocionesActivas = await this.findAll({ activas: true });

    return promocionesActivas.filter((promocion) => {
      // Verificar si es solo para mayoristas
      if (promocion.soloMayoristas && !esMayorista) return false;

      return promocion.puedeAplicarse(productos, montoTotal);
    });
  }

  async aplicarMejorPromocion(
    productos: { id: number; categoriaId: number; cantidad: number }[],
    montoTotal: number,
    esMayorista: boolean = false
  ): Promise<{ promocion: Promocion | null; descuento: number }> {
    const promocionesAplicables = await this.getPromocionesAplicables(
      productos,
      montoTotal,
      esMayorista
    );

    if (promocionesAplicables.length === 0) {
      return { promocion: null, descuento: 0 };
    }

    // Encontrar la promoción con mayor descuento
    let mejorPromocion: Promocion | null = null;
    let mayorDescuento = 0;

    for (const promocion of promocionesAplicables) {
      const descuento = promocion.calcularDescuento(montoTotal);
      if (descuento > mayorDescuento) {
        mayorDescuento = descuento;
        mejorPromocion = promocion;
      }
    }

    return { promocion: mejorPromocion, descuento: mayorDescuento };
  }

  async incrementarUsoPromocion(id: number): Promise<void> {
    const promocion = await this.findOne(id);
    promocion.incrementarUso();
    await this.promocionesRepository.save(promocion);
  }

  // Tarea automática para actualizar estados
  async actualizarEstadosPromociones(): Promise<void> {
    const ahora = new Date();

    // Activar promociones programadas que ya iniciaron
    await this.promocionesRepository
      .createQueryBuilder()
      .update(Promocion)
      .set({ estado: EstadoPromocion.Activa })
      .where("estado = :estadoProgramada", {
        estadoProgramada: EstadoPromocion.Programada,
      })
      .andWhere("fechaInicio <= :ahora", { ahora })
      .andWhere("fechaFin >= :ahora", { ahora })
      .execute();

    // Expirar promociones que ya terminaron
    await this.promocionesRepository
      .createQueryBuilder()
      .update(Promocion)
      .set({ estado: EstadoPromocion.Expirada })
      .where("estado = :estadoActiva", { estadoActiva: EstadoPromocion.Activa })
      .andWhere("fechaFin < :ahora", { ahora })
      .execute();
  }
}
