import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

// Entidad básica temporal para evitar errores de importación
// Se implementará completamente en la Fase 3
@Entity("personalizacion_prenda")
export class PersonalizacionPrenda {
  @PrimaryGeneratedColumn({ name: "id_personalizacion" })
  id: number;

  @Column({ name: "id_cliente", type: "int", nullable: false })
  clienteId: number;

  @Column({ name: "id_producto", type: "int", nullable: false })
  productoId: number;

  @Column({ name: "id_talla", type: "int", nullable: false })
  tallaId: number;

  @Column({ name: "texto_personalizado", type: "text", nullable: true })
  textoPersonalizado: string;

  @Column({
    name: "posicion_diseno",
    type: "enum",
    enum: ["pecho", "espalda", "manga", "completo", "lateral"],
    nullable: false,
  })
  posicionDiseno: string;

  @Column({
    name: "archivo_cliente",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  archivoCliente: string;

  @Column({ name: "instrucciones_especiales", type: "text", nullable: true })
  instruccionesEspeciales: string;

  @Column({ name: "aprobado_por_cliente", type: "boolean", default: false })
  aprobadoPorCliente: boolean;

  @Column({ name: "aprobado_por_disenador", type: "boolean", default: false })
  aprobadoPorDisenador: boolean;

  @CreateDateColumn({
    name: "fecha_creacion",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  fechaCreacion: Date;
}
