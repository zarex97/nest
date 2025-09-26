import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { StockProducto } from "./stock-producto.entity";

@Entity("talla")
export class Talla {
  @PrimaryGeneratedColumn({ name: "id_talla" })
  id: number;

  @Column({ type: "varchar", length: 10, nullable: false, unique: true })
  nombre: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  descripcion: string;

  @Column({
    type: "json",
    nullable: true,
  })
  medidas: {
    pecho?: number;
    cintura?: number;
    cadera?: number;
    largo?: number;
    [key: string]: any;
  };

  @Column({ type: "boolean", default: true })
  activa: boolean;

  // Relaciones
  @OneToMany(() => StockProducto, (stock) => stock.talla)
  stocks: StockProducto[];

  // Métodos helper
  estaActiva(): boolean {
    return this.activa;
  }

  activar(): void {
    this.activa = true;
  }

  desactivar(): void {
    this.activa = false;
  }

  tieneMedidas(): boolean {
    return this.medidas !== null && Object.keys(this.medidas || {}).length > 0;
  }

  getMedida(tipo: string): number | undefined {
    return this.medidas?.[tipo];
  }

  setMedida(tipo: string, valor: number): void {
    if (!this.medidas) {
      this.medidas = {};
    }
    this.medidas[tipo] = valor;
  }

  // Método para obtener todas las medidas como string formateado
  getMedidasFormateadas(): string {
    if (!this.tieneMedidas()) {
      return "Sin medidas especificadas";
    }

    const medidas = [];
    if (this.medidas?.pecho) medidas.push(`Pecho: ${this.medidas.pecho}cm`);
    if (this.medidas?.cintura)
      medidas.push(`Cintura: ${this.medidas.cintura}cm`);
    if (this.medidas?.cadera) medidas.push(`Cadera: ${this.medidas.cadera}cm`);
    if (this.medidas?.largo) medidas.push(`Largo: ${this.medidas.largo}cm`);

    return medidas.join(", ") || "Medidas no disponibles";
  }
}
