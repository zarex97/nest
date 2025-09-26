// pedido.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
} from "typeorm";
import { User } from "src/users/entities/user.entity";
import { DetallePedido } from "./detalle-pedido.entity";
import { Transaccion } from "./transaccion.entity";

export enum EstadoPedido {
  Cotizacion = "cotizacion",
  Pendiente = "pendiente",
  Confirmado = "confirmado",
  EnProduccion = "en_produccion",
  ControlCalidad = "control_calidad",
  Terminado = "terminado",
  ListoRetiro = "listo_retiro",
  Entregado = "entregado",
  Cancelado = "cancelado",
}

export enum MetodoPago {
  Efectivo = "efectivo",
  Presencial = "presencial",
}

export enum PrioridadPedido {
  Normal = "normal",
  Urgente = "urgente",
  Express = "express",
}

@Entity("pedido")
export class Pedido {
  @PrimaryGeneratedColumn({ name: "id_pedido" })
  id: number;

  @Column({
    name: "numero_pedido",
    type: "varchar",
    length: 20,
    unique: true,
  })
  numeroPedido: string;

  @Column({ name: "id_cliente", type: "int" })
  clienteId: number;

  @CreateDateColumn({
    name: "fecha_pedido",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  fechaPedido: Date;

  @Column({
    type: "enum",
    enum: EstadoPedido,
    default: EstadoPedido.Pendiente,
  })
  estado: EstadoPedido;

  @Column({
    name: "metodo_pago",
    type: "enum",
    enum: MetodoPago,
    default: MetodoPago.Presencial,
  })
  metodoPago: MetodoPago;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  subtotal: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  descuento: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  impuestos: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  total: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  sena: number;

  // Método helper para obtener saldo pendiente (calculado en tiempo real)
  getSaldoPendiente(): number {
    return this.total - this.sena;
  }

  @Column({
    name: "direccion_retiro",
    type: "varchar",
    length: 255,
    default: "Local principal",
  })
  direccionRetiro: string;

  @Column({
    name: "fecha_entrega_estimada",
    type: "date",
    nullable: true,
  })
  fechaEntregaEstimada: Date;

  @Column({
    name: "fecha_entrega_real",
    type: "date",
    nullable: true,
  })
  fechaEntregaReal: Date;

  @Column({
    name: "notas_produccion",
    type: "text",
    nullable: true,
  })
  notasProduccion: string;

  @Column({
    type: "enum",
    enum: PrioridadPedido,
    default: PrioridadPedido.Normal,
  })
  prioridad: PrioridadPedido;

  @Column({ type: "boolean", default: false })
  pagado: boolean;

  @Column({
    name: "fecha_pago",
    type: "datetime",
    nullable: true,
  })
  fechaPago: Date;

  @Column({
    name: "empleado_atencion",
    type: "int",
    nullable: true,
  })
  empleadoAtencionId: number;

  @Column({
    name: "fechaActualizacion",
    type: "datetime",
    precision: 6,
    default: () => "CURRENT_TIMESTAMP(6)",
    onUpdate: "CURRENT_TIMESTAMP(6)",
  })
  fechaActualizacion: Date;

  // Relaciones
  @ManyToOne(() => User)
  @JoinColumn({ name: "id_cliente" })
  cliente: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: "empleado_atencion" })
  empleadoAtencion: User;

  @OneToMany(() => DetallePedido, (detalle) => detalle.pedido, {
    cascade: true,
  })
  detalles: DetallePedido[];

  @OneToMany(() => Transaccion, (transaccion) => transaccion.pedido)
  transacciones: Transaccion[];

  // Triggers de BD simulados con métodos
  @BeforeInsert()
  generarNumeroPedido() {
    if (!this.numeroPedido) {
      const anio = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-4);
      this.numeroPedido = `SR${anio}-${timestamp}`;
    }
  }

  // Métodos helper
  estaPagado(): boolean {
    return this.pagado;
  }

  puedeConfirmarse(): boolean {
    return this.estado === EstadoPedido.Pendiente;
  }

  puedeProducirse(): boolean {
    return this.estado === EstadoPedido.Confirmado;
  }

  estaTerminado(): boolean {
    return [
      EstadoPedido.Terminado,
      EstadoPedido.ListoRetiro,
      EstadoPedido.Entregado,
    ].includes(this.estado);
  }

  puedeEntregarse(): boolean {
    return this.estado === EstadoPedido.ListoRetiro && this.pagado;
  }

  calcularTotal(): void {
    const subtotalCalculado =
      this.detalles?.reduce((sum, detalle) => sum + detalle.subtotal, 0) || 0;

    this.subtotal = subtotalCalculado - this.descuento;
    this.impuestos = this.subtotal * 0.19; // IVA colombiano
    this.total = this.subtotal + this.impuestos;
  }

  getTiempoRestante(): number {
    if (!this.fechaEntregaEstimada) return 0;

    const hoy = new Date();
    const fechaEntrega = new Date(this.fechaEntregaEstimada);
    const diferencia = fechaEntrega.getTime() - hoy.getTime();

    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }
}
