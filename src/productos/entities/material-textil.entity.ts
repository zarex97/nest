import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { ProductoRopa } from "./producto-ropa.entity";

@Entity("material_textil")
export class MaterialTextil {
  @PrimaryGeneratedColumn({ name: "id_material" })
  id: number;

  @Column({ type: "varchar", length: 100, nullable: false, unique: true })
  nombre: string;

  @Column({ type: "text", nullable: true })
  descripcion: string;

  @Column({ type: "varchar", length: 200, nullable: false })
  composicion: string;

  @Column({ type: "int", nullable: true })
  gramaje: number;

  @Column({
    name: "temperatura_sublimacion",
    type: "int",
    nullable: false,
  })
  temperaturaSublimacion: number;

  @Column({
    name: "tiempo_prensado",
    type: "int",
    nullable: false,
  })
  tiempoPrensado: number;

  @Column({
    name: "presion_recomendada",
    type: "varchar",
    length: 50,
    nullable: false,
  })
  presionRecomendada: string;

  @Column({
    name: "cuidados_lavado",
    type: "text",
    nullable: true,
  })
  cuidadosLavado: string;

  @Column({ type: "boolean", default: true })
  transpirable: boolean;

  @Column({ type: "boolean", default: false })
  elastico: boolean;

  @Column({ type: "boolean", default: true })
  activo: boolean;

  // Relaciones
  @OneToMany(() => ProductoRopa, (producto) => producto.material)
  productos: ProductoRopa[];

  // Métodos helper
  estaActivo(): boolean {
    return this.activo;
  }

  esTranspirable(): boolean {
    return this.transpirable;
  }

  esElastico(): boolean {
    return this.elastico;
  }

  getConfiguracionSublimacion(): {
    temperatura: number;
    tiempo: number;
    presion: string;
  } {
    return {
      temperatura: this.temperaturaSublimacion,
      tiempo: this.tiempoPrensado,
      presion: this.presionRecomendada,
    };
  }

  esAptoParaSublimacion(): boolean {
    return this.temperaturaSublimacion > 0 && this.tiempoPrensado > 0;
  }

  activar(): void {
    this.activo = true;
  }

  desactivar(): void {
    this.activo = false;
  }
}
