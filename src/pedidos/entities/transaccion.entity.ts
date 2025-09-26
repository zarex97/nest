// transaccion.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Pedido } from "./pedido.entity";
import { User } from "src/users/entities/user.entity";

export enum MetodoTransaccion {
  EfectivoLocal = "efectivo_local",
  EfectivoEntrega = "efectivo_entrega",
  Sena = "sena",
}

export enum EstadoTransaccion {
  Pendiente = "pendiente",
  Completada = "completada",
  Cancelada = "cancelada",
}

@Entity("transaccion")
export class Transaccion {
  @PrimaryGeneratedColumn({ name: "id_transaccion" })
  id: number;

  @Column({ name: "id_pedido", type: "int" })
  pedidoId: number;

  @Column({
    type: "enum",
    enum: MetodoTransaccion,
  })
  metodo: MetodoTransaccion;

  @Column({
    type: "enum",
    enum: EstadoTransaccion,
  })
  estado: EstadoTransaccion;

  @CreateDateColumn({
    name: "fecha_transaccion",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  fechaTransaccion: Date;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  monto: number;

  @Column({
    name: "recibido_por",
    type: "int",
    nullable: true,
  })
  recibidoPorId: number;

  @Column({ type: "text", nullable: true })
  notas: string;

  @Column({
    name: "es_sena",
    type: "boolean",
    default: false,
  })
  esSena: boolean;

  // Relaciones
  @ManyToOne(() => Pedido, (pedido) => pedido.transacciones)
  @JoinColumn({ name: "id_pedido" })
  pedido: Pedido;

  @ManyToOne(() => User)
  @JoinColumn({ name: "recibido_por" })
  recibidoPor: User;

  // Métodos helper
  estaCompletada(): boolean {
    return this.estado === EstadoTransaccion.Completada;
  }

  esPagoCompleto(): boolean {
    return !this.esSena && this.estaCompletada();
  }

  esSenaCompleta(): boolean {
    return this.esSena && this.estaCompletada();
  }
}
