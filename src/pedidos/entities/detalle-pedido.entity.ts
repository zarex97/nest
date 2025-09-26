import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Pedido } from "./pedido.entity";
import { ProductoRopa } from "src/productos/entities/producto-ropa.entity";
import { Talla } from "src/productos/entities/talla.entity";
import { PersonalizacionPrenda } from "src/personalizacion/entities/personalizacion-prenda.entity";

export enum EstadoProduccion {
  Pendiente = "pendiente",
  Diseno = "diseno",
  Impresion = "impresion",
  Prensado = "prensado",
  ControlCalidad = "control_calidad",
  Terminado = "terminado",
  ConProblemas = "con_problemas",
}

@Entity("detalle_pedido")
export class DetallePedido {
  @PrimaryGeneratedColumn({ name: "id_detalle" })
  id: number;

  @Column({ name: "id_pedido", type: "int" })
  pedidoId: number;

  @Column({ name: "id_producto", type: "int" })
  productoId: number;

  @Column({ name: "id_talla", type: "int" })
  tallaId: number;

  @Column({
    name: "id_personalizacion",
    type: "int",
    nullable: true,
  })
  personalizacionId: number;

  @Column({ type: "int" })
  cantidad: number;

  @Column({
    name: "precio_unitario",
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  precioUnitario: number;

  @Column({
    name: "precio_personalizacion",
    type: "decimal",
    precision: 6,
    scale: 2,
    default: 0.0,
  })
  precioPersonalizacion: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  subtotal: number;

  @Column({
    name: "estado_produccion",
    type: "enum",
    enum: EstadoProduccion,
    default: EstadoProduccion.Pendiente,
  })
  estadoProduccion: EstadoProduccion;

  @Column({ type: "text", nullable: true })
  notas: string;

  @Column({
    name: "fecha_inicio_produccion",
    type: "datetime",
    nullable: true,
  })
  fechaInicioProduccion: Date;

  @Column({
    name: "fecha_fin_produccion",
    type: "datetime",
    nullable: true,
  })
  fechaFinProduccion: Date;

  // Relaciones
  @ManyToOne(() => Pedido, (pedido) => pedido.detalles, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "id_pedido" })
  pedido: Pedido;

  @ManyToOne(() => ProductoRopa)
  @JoinColumn({ name: "id_producto" })
  producto: ProductoRopa;

  @ManyToOne(() => Talla)
  @JoinColumn({ name: "id_talla" })
  talla: Talla;

  @ManyToOne(() => PersonalizacionPrenda)
  @JoinColumn({ name: "id_personalizacion" })
  personalizacion: PersonalizacionPrenda;

  // Métodos helper
  estaTerminado(): boolean {
    return this.estadoProduccion === EstadoProduccion.Terminado;
  }

  tieneProblemas(): boolean {
    return this.estadoProduccion === EstadoProduccion.ConProblemas;
  }

  estaEnProduccion(): boolean {
    return [
      EstadoProduccion.Diseno,
      EstadoProduccion.Impresion,
      EstadoProduccion.Prensado,
    ].includes(this.estadoProduccion);
  }

  calcularSubtotal(): void {
    const precioBase = this.precioUnitario * this.cantidad;
    const precioPersonalizacionTotal =
      this.precioPersonalizacion * this.cantidad;
    this.subtotal = precioBase + precioPersonalizacionTotal;
  }

  iniciarProduccion(): void {
    if (this.estadoProduccion === EstadoProduccion.Pendiente) {
      this.estadoProduccion = EstadoProduccion.Diseno;
      this.fechaInicioProduccion = new Date();
    }
  }

  terminarProduccion(): void {
    this.estadoProduccion = EstadoProduccion.Terminado;
    this.fechaFinProduccion = new Date();
  }

  marcarConProblemas(notas?: string): void {
    this.estadoProduccion = EstadoProduccion.ConProblemas;
    if (notas) {
      this.notas = notas;
    }
  }
}
