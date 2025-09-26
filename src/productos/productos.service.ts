import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, Like } from "typeorm";
import { ProductoRopa, EstadoProducto } from "./entities/producto-ropa.entity";
import { StockProducto } from "./entities/stock-producto.entity";
import { CategoriaRopa } from "./entities/categoria-ropa.entity";
import { MaterialTextil } from "./entities/material-textil.entity";
import { Talla } from "./entities/talla.entity";
import { CreateProductoDto } from "./dtos/create-producto.dto";
import { UpdateProductoDto } from "./dtos/update-producto.dto";
import { UpdateStockDto } from "./dtos/UpdateStockDto";

export interface ProductoFilter {
  categoria?: number;
  material?: number;
  estado?: EstadoProducto;
  genero?: string;
  search?: string;
  soloDisponibles?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(ProductoRopa)
    private productosRepository: Repository<ProductoRopa>,
    @InjectRepository(StockProducto)
    private stockRepository: Repository<StockProducto>,
    @InjectRepository(CategoriaRopa)
    private categoriasRepository: Repository<CategoriaRopa>,
    @InjectRepository(MaterialTextil)
    private materialesRepository: Repository<MaterialTextil>,
    @InjectRepository(Talla)
    private tallasRepository: Repository<Talla>
  ) {}

  // CRUD Productos
  async create(createProductoDto: CreateProductoDto): Promise<ProductoRopa> {
    // Verificar que la categoría existe
    const categoria = await this.categoriasRepository.findOne({
      where: { id: createProductoDto.categoriaId, activa: true },
    });
    if (!categoria) {
      throw new NotFoundException("Categoría no encontrada o inactiva");
    }

    // Verificar que el material existe
    const material = await this.materialesRepository.findOne({
      where: { id: createProductoDto.materialId, activo: true },
    });
    if (!material) {
      throw new NotFoundException("Material no encontrado o inactivo");
    }

    const producto = this.productosRepository.create(createProductoDto);
    return await this.productosRepository.save(producto);
  }

  async findAll(filters: ProductoFilter = {}): Promise<{
    productos: ProductoRopa[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, ...otherFilters } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.productosRepository
      .createQueryBuilder("producto")
      .leftJoinAndSelect("producto.categoria", "categoria")
      .leftJoinAndSelect("producto.material", "material")
      .leftJoinAndSelect("producto.stock", "stock")
      .leftJoinAndSelect("stock.talla", "talla");

    // Aplicar filtros
    if (otherFilters.categoria) {
      queryBuilder.andWhere("producto.categoriaId = :categoriaId", {
        categoriaId: otherFilters.categoria,
      });
    }

    if (otherFilters.material) {
      queryBuilder.andWhere("producto.materialId = :materialId", {
        materialId: otherFilters.material,
      });
    }

    if (otherFilters.estado) {
      queryBuilder.andWhere("producto.estado = :estado", {
        estado: otherFilters.estado,
      });
    }

    if (otherFilters.genero) {
      queryBuilder.andWhere("categoria.genero = :genero", {
        genero: otherFilters.genero,
      });
    }

    if (otherFilters.search) {
      queryBuilder.andWhere(
        "(producto.nombre LIKE :search OR producto.descripcion LIKE :search)",
        { search: `%${otherFilters.search}%` }
      );
    }

    if (otherFilters.soloDisponibles) {
      queryBuilder.andWhere("producto.estado = :estadoActivo", {
        estadoActivo: EstadoProducto.Activo,
      });
      queryBuilder.andWhere("stock.cantidad > 0");
    }

    // Contar total antes de aplicar paginación
    const total = await queryBuilder.getCount();

    // Aplicar paginación y ordenamiento
    const productos = await queryBuilder
      .orderBy("producto.fechaCreacion", "DESC")
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      productos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<ProductoRopa> {
    const producto = await this.productosRepository.findOne({
      where: { id },
      relations: ["categoria", "material", "stock", "stock.talla"],
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return producto;
  }

  async update(
    id: number,
    updateProductoDto: UpdateProductoDto
  ): Promise<ProductoRopa> {
    const producto = await this.findOne(id);

    // Verificar categoría si se está actualizando
    if (updateProductoDto.categoriaId) {
      const categoria = await this.categoriasRepository.findOne({
        where: { id: updateProductoDto.categoriaId, activa: true },
      });
      if (!categoria) {
        throw new NotFoundException("Categoría no encontrada o inactiva");
      }
    }

    // Verificar material si se está actualizando
    if (updateProductoDto.materialId) {
      const material = await this.materialesRepository.findOne({
        where: { id: updateProductoDto.materialId, activo: true },
      });
      if (!material) {
        throw new NotFoundException("Material no encontrado o inactivo");
      }
    }

    Object.assign(producto, updateProductoDto);
    return await this.productosRepository.save(producto);
  }

  async remove(id: number): Promise<void> {
    const producto = await this.findOne(id);
    await this.productosRepository.remove(producto);
  }

  // Gestión de Stock
  async updateStock(
    productoId: number,
    tallaId: number,
    updateStockDto: UpdateStockDto
  ): Promise<StockProducto> {
    // Verificar que el producto existe
    await this.findOne(productoId);

    // Verificar que la talla existe
    const talla = await this.tallasRepository.findOne({
      where: { id: tallaId, activa: true },
    });
    if (!talla) {
      throw new NotFoundException("Talla no encontrada o inactiva");
    }

    // Buscar o crear el registro de stock
    let stock = await this.stockRepository.findOne({
      where: { productoId, tallaId },
      relations: ["producto", "talla"],
    });

    if (!stock) {
      stock = this.stockRepository.create({
        productoId,
        tallaId,
        cantidad: updateStockDto.cantidad,
        stockMinimo: updateStockDto.stockMinimo || 3,
        precioAdicional: updateStockDto.precioAdicional || 0,
      });
    } else {
      Object.assign(stock, updateStockDto);
    }

    const savedStock = await this.stockRepository.save(stock);

    // Actualizar estado del producto basado en stock
    await this.actualizarEstadoProductoPorStock(productoId);

    return savedStock;
  }

  async getStock(productoId: number): Promise<StockProducto[]> {
    return await this.stockRepository.find({
      where: { productoId },
      relations: ["talla"],
      order: { talla: { nombre: "ASC" } },
    });
  }

  async getStockCritico(): Promise<StockProducto[]> {
    return await this.stockRepository
      .createQueryBuilder("stock")
      .leftJoinAndSelect("stock.producto", "producto")
      .leftJoinAndSelect("stock.talla", "talla")
      .leftJoinAndSelect("producto.categoria", "categoria")
      .where("stock.cantidad <= stock.stockMinimo")
      .orderBy("stock.cantidad", "ASC")
      .getMany();
  }

  // Métodos auxiliares privados
  private async actualizarEstadoProductoPorStock(
    productoId: number
  ): Promise<void> {
    const stocks = await this.stockRepository.find({
      where: { productoId },
    });

    const producto = await this.productosRepository.findOne({
      where: { id: productoId },
    });

    if (!producto) return;

    // Si no hay stock disponible en ninguna talla, marcar como agotado
    const hayStock = stocks.some((stock) => stock.cantidad > 0);

    if (!hayStock && producto.estado === EstadoProducto.Activo) {
      producto.estado = EstadoProducto.Agotado;
      await this.productosRepository.save(producto);
    } else if (hayStock && producto.estado === EstadoProducto.Agotado) {
      producto.estado = EstadoProducto.Activo;
      await this.productosRepository.save(producto);
    }
  }

  // Métodos para obtener datos relacionados
  async getCategorias(): Promise<CategoriaRopa[]> {
    return await this.categoriasRepository.find({
      where: { activa: true },
      order: { nombre: "ASC" },
    });
  }

  async getMateriales(): Promise<MaterialTextil[]> {
    return await this.materialesRepository.find({
      where: { activo: true },
      order: { nombre: "ASC" },
    });
  }

  async getTallas(): Promise<Talla[]> {
    return await this.tallasRepository.find({
      where: { activa: true },
      order: { nombre: "ASC" },
    });
  }

  // Método para buscar productos disponibles (para clientes)
  async findDisponibles(filters: ProductoFilter = {}): Promise<ProductoRopa[]> {
    const queryBuilder = this.productosRepository
      .createQueryBuilder("producto")
      .leftJoinAndSelect("producto.categoria", "categoria")
      .leftJoinAndSelect("producto.material", "material")
      .leftJoinAndSelect("producto.stock", "stock")
      .leftJoinAndSelect("stock.talla", "talla")
      .where("producto.estado = :estado", { estado: EstadoProducto.Activo })
      .andWhere("categoria.activa = :categoriaActiva", {
        categoriaActiva: true,
      })
      .andWhere("material.activo = :materialActivo", { materialActivo: true })
      .andWhere("stock.cantidad > 0");

    if (filters.categoria) {
      queryBuilder.andWhere("producto.categoriaId = :categoriaId", {
        categoriaId: filters.categoria,
      });
    }

    if (filters.genero) {
      queryBuilder.andWhere("categoria.genero = :genero", {
        genero: filters.genero,
      });
    }

    return await queryBuilder.orderBy("producto.nombre", "ASC").getMany();
  }
}
