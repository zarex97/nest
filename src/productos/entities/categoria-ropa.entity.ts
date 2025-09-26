import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { ProductoRopa } from "./producto-ropa.entity";

export enum GeneroCategoria {
  Masculino = "masculino",
  Femenino = "femenino",
  Unisex = "unisex",
  Infantil = "infantil",
}

@Entity("categoria_ropa")
export class CategoriaRopa {
  @PrimaryGeneratedColumn({ name: "id_categoria" })
  id: number;

  @Column({ type: "varchar", length: 50, nullable: false, unique: true })
  nombre: string;

  @Column({ type: "text", nullable: true })
  descripcion: string;

  @Column({
    name: "imagen_url",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  imagenUrl: string;

  @Column({
    type: "enum",
    enum: GeneroCategoria,
    nullable: false,
  })
  genero: GeneroCategoria;

  @Column({ type: "boolean", default: true })
  activa: boolean;

  @CreateDateColumn({
    name: "fecha_creacion",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  fechaCreacion: Date;

  // Relaciones
  @OneToMany(() => ProductoRopa, (producto) => producto.categoria)
  productos: ProductoRopa[];

  // Métodos helper
  estaActiva(): boolean {
    return this.activa;
  }

  desactivar(): void {
    this.activa = false;
  }

  activar(): void {
    this.activa = true;
  }

  esUnisex(): boolean {
    return this.genero === GeneroCategoria.Unisex;
  }

  esInfantil(): boolean {
    return this.genero === GeneroCategoria.Infantil;
  }
}
