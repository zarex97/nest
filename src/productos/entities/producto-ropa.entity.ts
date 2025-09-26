import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { CategoriaRopa } from "./categoria-ropa.entity";
import { MaterialTextil } from "./material-textil.entity";
import { StockProducto } from "./stock-producto.entity";

export enum EstadoProducto {
  Activo = "activo",
  Inactivo = "inactivo",
  Agotado = "agotado",
  Descontinuado = "descontinuado",
}

export enum Temporada {
  Verano = "verano",
  Invierno = "invierno",
  Primavera = "primavera",
  Otono = "otono",
  TodoElAno = "todo_el_ano",
}

@Entity("producto_ropa")
export class ProductoRopa {
  @PrimaryGeneratedColumn({ name: "id_producto" })
  id: number;

  @Column({ type: "varchar", length: 100, nullable: false })
  nombre: string;

  @Column({ type: "text", nullable: true })
  descripcion: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
  precio: number;

  @Column({
    name: "precio_mayorista",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  precioMayorista: number;

  @Column({ name: "id_categoria", type: "int", nullable: false })
  categoriaId: number;

  @Column({ name: "id_material", type: "int", nullable: false })
  materialId: number;

  @Column({
    name: "imagen_principal",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  imagenPrincipal: string;

  @Column({
    name: "imagenes_adicionales",
    type: "json",
    nullable: true,
  })
  imagenesAdicionales: string[];

  @Column({
    type: "enum",
    enum: EstadoProducto,
    default: EstadoProducto.Activo,
  })
  estado: EstadoProducto;

  @Column({ type: "decimal", precision: 6, scale: 2, nullable: true })
  peso: number;

  @Column({
    name: "tiempo_produccion",
    type: "int",
    default: 3,
  })
  tiempoProduccion: number;

  @Column({
    name: "es_temporada",
    type: "boolean",
    default: false,
  })
  esTemporada: boolean;

  @Column({
    type: "enum",
    enum: Temporada,
    default: Temporada.TodoElAno,
  })
  temporada: Temporada;

  @CreateDateColumn({
    name: "fecha_creacion",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  fechaCreacion: Date;

  @UpdateDateColumn({
    name: "fecha_actualizacion",
    type: "datetime",
    nullable: true,
  })
  fechaActualizacion: Date;

  // Relaciones
  @ManyToOne(() => CategoriaRopa, (categoria) => categoria.productos)
  @JoinColumn({ name: "id_categoria" })
  categoria: CategoriaRopa;

  @ManyToOne(() => MaterialTextil, (material) => material.productos)
  @JoinColumn({ name: "id_material" })
  material: MaterialTextil;

  @OneToMany(() => StockProducto, (stock) => stock.producto)
  stock: StockProducto[];

  // Métodos helper
  estaDisponible(): boolean {
    return this.estado === EstadoProducto.Activo;
  }

  estaAgotado(): boolean {
    return this.estado === EstadoProducto.Agotado;
  }

  getPrecioFinal(esMayorista: boolean = false): number {
    return esMayorista && this.precioMayorista
      ? this.precioMayorista
      : this.precio;
  }
}
