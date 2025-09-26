import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseIntPipe,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/auth/decorators/roles.decorator";
import { UserRole } from "src/users/entities/user.entity";
import { ProductosService, ProductoFilter } from "./productos.service";
import { CreateProductoDto } from "./dtos/create-producto.dto";
import { UpdateProductoDto } from "./dtos/update-producto.dto";
import { UpdateStockDto } from "./dtos/UpdateStockDto";
import { ProductoRopa, EstadoProducto } from "./entities/producto-ropa.entity";
import { StockProducto } from "./entities/stock-producto.entity";
import { CategoriaRopa } from "./entities/categoria-ropa.entity";
import { MaterialTextil } from "./entities/material-textil.entity";
import { Talla } from "./entities/talla.entity";

@ApiTags("Productos")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Controller("productos")
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  // === ENDPOINTS ADMIN ===

  @Post()
  @Roles(UserRole.Admin, UserRole.Empleado)
  @ApiOperation({ summary: "Crear nuevo producto (Admin/Empleado)" })
  @ApiResponse({
    status: 201,
    description: "Producto creado exitosamente",
    type: ProductoRopa,
  })
  @ApiResponse({
    status: 404,
    description: "Categoría o material no encontrado",
  })
  async create(
    @Body() createProductoDto: CreateProductoDto
  ): Promise<ProductoRopa> {
    return await this.productosService.create(createProductoDto);
  }

  @Get("admin")
  @Roles(UserRole.Admin, UserRole.Empleado)
  @ApiOperation({
    summary: "Listar todos los productos con filtros avanzados (Admin)",
  })
  @ApiQuery({ name: "categoria", required: false, type: Number })
  @ApiQuery({ name: "material", required: false, type: Number })
  @ApiQuery({ name: "estado", required: false, enum: EstadoProducto })
  @ApiQuery({ name: "genero", required: false, type: String })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  async findAllAdmin(@Query() filters: ProductoFilter) {
    return await this.productosService.findAll(filters);
  }

  @Patch(":id")
  @Roles(UserRole.Admin, UserRole.Empleado)
  @ApiOperation({ summary: "Actualizar producto (Admin/Empleado)" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({
    status: 200,
    description: "Producto actualizado exitosamente",
    type: ProductoRopa,
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateProductoDto: UpdateProductoDto
  ): Promise<ProductoRopa> {
    return await this.productosService.update(id, updateProductoDto);
  }

  @Delete(":id")
  @Roles(UserRole.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Eliminar producto (Solo Admin)" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 204, description: "Producto eliminado exitosamente" })
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return await this.productosService.remove(id);
  }

  // === GESTIÓN DE STOCK ===

  @Patch(":id/stock/:tallaId")
  @Roles(UserRole.Admin, UserRole.Empleado)
  @ApiOperation({ summary: "Actualizar stock de producto por talla" })
  @ApiParam({ name: "id", type: Number, description: "ID del producto" })
  @ApiParam({ name: "tallaId", type: Number, description: "ID de la talla" })
  @ApiResponse({
    status: 200,
    description: "Stock actualizado exitosamente",
    type: StockProducto,
  })
  async updateStock(
    @Param("id", ParseIntPipe) id: number,
    @Param("tallaId", ParseIntPipe) tallaId: number,
    @Body() updateStockDto: UpdateStockDto
  ): Promise<StockProducto> {
    return await this.productosService.updateStock(id, tallaId, updateStockDto);
  }

  @Get(":id/stock")
  @Roles(UserRole.Admin, UserRole.Empleado)
  @ApiOperation({
    summary: "Obtener stock de un producto por todas las tallas",
  })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({
    status: 200,
    description: "Stock del producto",
    type: [StockProducto],
  })
  async getStock(
    @Param("id", ParseIntPipe) id: number
  ): Promise<StockProducto[]> {
    return await this.productosService.getStock(id);
  }

  @Get("admin/stock-critico")
  @Roles(UserRole.Admin, UserRole.Empleado)
  @ApiOperation({ summary: "Obtener productos con stock crítico" })
  @ApiResponse({
    status: 200,
    description: "Productos con stock bajo",
    type: [StockProducto],
  })
  async getStockCritico(): Promise<StockProducto[]> {
    return await this.productosService.getStockCritico();
  }

  // === SUBIDA DE IMÁGENES ===

  @Post(":id/imagen-principal")
  @Roles(UserRole.Admin, UserRole.Empleado)
  @UseInterceptors(FileInterceptor("imagen"))
  @ApiOperation({ summary: "Subir imagen principal del producto" })
  @ApiConsumes("multipart/form-data")
  @ApiParam({ name: "id", type: Number })
  async subirImagenPrincipal(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File
  ): Promise<{ url: string }> {
    // Aquí implementarías la lógica de subida de archivos
    // Por ahora retornamos un placeholder
    const url = `/uploads/productos/${id}/principal-${Date.now()}.jpg`;

    await this.productosService.update(id, {
      imagenPrincipal: url,
    });

    return { url };
  }

  @Post(":id/imagenes")
  @Roles(UserRole.Admin, UserRole.Empleado)
  @UseInterceptors(FilesInterceptor("imagenes", 5))
  @ApiOperation({
    summary: "Subir imágenes adicionales del producto (máximo 5)",
  })
  @ApiConsumes("multipart/form-data")
  @ApiParam({ name: "id", type: Number })
  async subirImagenes(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<{ urls: string[] }> {
    // Implementar lógica de subida de múltiples archivos
    const urls = files.map(
      (file, index) =>
        `/uploads/productos/${id}/adicional-${index}-${Date.now()}.jpg`
    );

    const producto = await this.productosService.findOne(id);
    const imagenesActuales = producto.imagenesAdicionales || [];
    const nuevasImagenes = [...imagenesActuales, ...urls];

    await this.productosService.update(id, {
      imagenesAdicionales: nuevasImagenes,
    });

    return { urls };
  }

  // === ENDPOINTS PÚBLICOS (CLIENTES) ===

  @Get("disponibles")
  @ApiOperation({ summary: "Obtener productos disponibles para clientes" })
  @ApiQuery({ name: "categoria", required: false, type: Number })
  @ApiQuery({ name: "genero", required: false, type: String })
  async findDisponibles(
    @Query() filters: ProductoFilter
  ): Promise<ProductoRopa[]> {
    return await this.productosService.findDisponibles(filters);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener producto por ID (público)" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({
    status: 200,
    description: "Producto encontrado",
    type: ProductoRopa,
  })
  @ApiResponse({ status: 404, description: "Producto no encontrado" })
  async findOne(@Param("id", ParseIntPipe) id: number): Promise<ProductoRopa> {
    return await this.productosService.findOne(id);
  }

  // === DATOS AUXILIARES ===

  @Get("auxiliares/categorias")
  @ApiOperation({ summary: "Obtener todas las categorías activas" })
  @ApiResponse({
    status: 200,
    description: "Lista de categorías",
    type: [CategoriaRopa],
  })
  async getCategorias(): Promise<CategoriaRopa[]> {
    return await this.productosService.getCategorias();
  }

  @Get("auxiliares/materiales")
  @ApiOperation({ summary: "Obtener todos los materiales activos" })
  @ApiResponse({
    status: 200,
    description: "Lista de materiales",
    type: [MaterialTextil],
  })
  async getMateriales(): Promise<MaterialTextil[]> {
    return await this.productosService.getMateriales();
  }

  @Get("auxiliares/tallas")
  @ApiOperation({ summary: "Obtener todas las tallas activas" })
  @ApiResponse({ status: 200, description: "Lista de tallas", type: [Talla] })
  async getTallas(): Promise<Talla[]> {
    return await this.productosService.getTallas();
  }
}
