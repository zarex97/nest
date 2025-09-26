import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { ProductoRopa } from "./producto-ropa.entity";
import { Talla } from "./talla.entity";

@Entity("stock_producto")
@Index(["productoId", "tallaId"], { unique: true })
export class StockProducto {
  @PrimaryGeneratedColumn({ name: "id_stock" })
  id: number;

  @Column({ name: "id_producto", type: "int", nullable: false })
  productoId: number;

  @Column({ name: "id_talla", type: "int", nullable: false })
  tallaId: number;

  @Column({ type: "int", nullable: false, default: 0 })
  cantidad: number;

  @Column({
    name: "stock_minimo",
    type: "int",
    default: 3,
  })
  stockMinimo: number;

  @Column({
    name: "precio_adicional",
    type: "decimal",
    precision: 6,
    scale: 2,
    default: 0.0,
  })
  precioAdicional: number;

  @UpdateDateColumn({
    name: "fecha_actualizacion",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  fechaActualizacion: Date;

  // Relaciones
  @ManyToOne(() => ProductoRopa, (producto) => producto.stock, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "id_producto" })
  producto: ProductoRopa;

  @ManyToOne(() => Talla, (talla) => talla.stocks)
  @JoinColumn({ name: "id_talla" })
  talla: Talla;

  // Métodos helper
  estaDisponible(): boolean {
    return this.cantidad > 0;
  }

  estaEnStockMinimo(): boolean {
    return this.cantidad <= this.stockMinimo;
  }

  estaAgotado(): boolean {
    return this.cantidad === 0;
  }

  necesitaReabastecimiento(): boolean {
    return this.cantidad < this.stockMinimo;
  }

  puedeReducir(cantidadAReducir: number): boolean {
    return this.cantidad >= cantidadAReducir;
  }

  reducirStock(cantidad: number): boolean {
    if (!this.puedeReducir(cantidad)) {
      return false;
    }
    this.cantidad = Math.max(0, this.cantidad - cantidad);
    return true;
  }

  aumentarStock(cantidad: number): void {
    this.cantidad += cantidad;
  }

  establecerStock(nuevaCantidad: number): void {
    this.cantidad = Math.max(0, nuevaCantidad);
  }

  getPrecioTotal(precioBase: number): number {
    return precioBase + this.precioAdicional;
  }

  getEstadoStock(): "agotado" | "critico" | "bajo" | "normal" {
    if (this.estaAgotado()) return "agotado";
    if (this.cantidad <= this.stockMinimo * 0.5) return "critico";
    if (this.cantidad <= this.stockMinimo) return "bajo";
    return "normal";
  }

  getDiasEstimadosAgotamiento(ventaDiaria: number = 1): number {
    if (ventaDiaria <= 0) return Infinity;
    return Math.floor(this.cantidad / ventaDiaria);
  }
}
