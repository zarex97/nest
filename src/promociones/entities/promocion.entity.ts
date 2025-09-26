// promocion.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum TipoPromocion {
  Descuento = "descuento",
  PorcentajeDescuento = "porcentaje_descuento",
  ProductoGratis = "producto_gratis",
  EnvioGratis = "envio_gratis",
  DosPorUno = "dos_por_uno",
}

export enum EstadoPromocion {
  Activa = "activa",
  Inactiva = "inactiva",
  Programada = "programada",
  Expirada = "expirada",
}

@Entity("promocion")
export class Promocion {
  @PrimaryGeneratedColumn({ name: "id_promocion" })
  id: number;

  @Column({ type: "varchar", length: 100, nullable: false })
  nombre: string;

  @Column({ type: "text", nullable: true })
  descripcion: string;

  @Column({
    type: "enum",
    enum: TipoPromocion,
    nullable: false,
  })
  tipo: TipoPromocion;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    comment: "Valor del descuento (fijo o porcentaje según tipo)",
  })
  valor: number;

  @Column({
    name: "fecha_inicio",
    type: "datetime",
  })
  fechaInicio: Date;

  @Column({
    name: "fecha_fin",
    type: "datetime",
  })
  fechaFin: Date;

  @Column({
    name: "productos_aplicables",
    type: "json",
    nullable: true,
    comment: "Array de IDs de productos aplicables, null = todos",
  })
  productosAplicables: number[];

  @Column({
    name: "categorias_aplicables",
    type: "json",
    nullable: true,
    comment: "Array de IDs de categorías aplicables",
  })
  categoriasAplicables: number[];

  @Column({
    name: "cantidad_minima",
    type: "int",
    default: 1,
    comment: "Cantidad mínima de productos para aplicar promoción",
  })
  cantidadMinima: number;

  @Column({
    name: "monto_minimo",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    comment: "Monto mínimo de compra para aplicar promoción",
  })
  montoMinimo: number;

  @Column({
    name: "limite_usos",
    type: "int",
    nullable: true,
    comment: "Límite total de usos de la promoción",
  })
  limiteUsos: number;

  @Column({
    name: "usos_actuales",
    type: "int",
    default: 0,
  })
  usosActuales: number;

  @Column({
    type: "enum",
    enum: EstadoPromocion,
    default: EstadoPromocion.Programada,
  })
  estado: EstadoPromocion;

  @Column({
    name: "solo_mayoristas",
    type: "boolean",
    default: false,
  })
  soloMayoristas: boolean;

  @CreateDateColumn({
    name: "fecha_creacion",
    type: "datetime",
  })
  fechaCreacion: Date;

  @UpdateDateColumn({
    name: "fecha_actualizacion",
    type: "datetime",
  })
  fechaActualizacion: Date;

  // Métodos helper
  estaActiva(): boolean {
    const ahora = new Date();
    return (
      this.estado === EstadoPromocion.Activa &&
      ahora >= this.fechaInicio &&
      ahora <= this.fechaFin &&
      (this.limiteUsos === null || this.usosActuales < this.limiteUsos)
    );
  }

  puedeAplicarse(
    productos: { id: number; categoriaId: number; cantidad: number }[],
    montoTotal: number
  ): boolean {
    if (!this.estaActiva()) return false;

    // Verificar monto mínimo
    if (this.montoMinimo && montoTotal < this.montoMinimo) return false;

    // Verificar cantidad mínima
    const cantidadTotal = productos.reduce((sum, p) => sum + p.cantidad, 0);
    if (cantidadTotal < this.cantidadMinima) return false;

    // Verificar productos aplicables
    if (this.productosAplicables && this.productosAplicables.length > 0) {
      const tieneProductoAplicable = productos.some((p) =>
        this.productosAplicables.includes(p.id)
      );
      if (!tieneProductoAplicable) return false;
    }

    // Verificar categorías aplicables
    if (this.categoriasAplicables && this.categoriasAplicables.length > 0) {
      const tieneCategoriaAplicable = productos.some((p) =>
        this.categoriasAplicables.includes(p.categoriaId)
      );
      if (!tieneCategoriaAplicable) return false;
    }

    return true;
  }

  calcularDescuento(montoTotal: number): number {
    if (!this.estaActiva()) return 0;

    switch (this.tipo) {
      case TipoPromocion.Descuento:
        return Math.min(this.valor, montoTotal);

      case TipoPromocion.PorcentajeDescuento:
        return (montoTotal * this.valor) / 100;

      default:
        return 0;
    }
  }

  incrementarUso(): void {
    this.usosActuales++;

    if (this.limiteUsos && this.usosActuales >= this.limiteUsos) {
      this.estado = EstadoPromocion.Expirada;
    }
  }

  activar(): void {
    const ahora = new Date();
    if (ahora >= this.fechaInicio && ahora <= this.fechaFin) {
      this.estado = EstadoPromocion.Activa;
    }
  }

  desactivar(): void {
    this.estado = EstadoPromocion.Inactiva;
  }
}
