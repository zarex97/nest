import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";

// Core modules
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { SessionModule } from "./session/session.module";
import { MailsModule } from "./mails/mails.module";
import { ForgotPasswordModule } from "./forgot-password/forgot-password.module";

// Business modules
import { ProductosModule } from "./productos/productos.module";
import { PedidosModule } from "./pedidos/pedidos.module";
// import { CarritoModule } from "./carrito/carrito.module";
// import { ChatModule } from "./chat/chat.module";
// import { PersonalizacionModule } from "./personalizacion/personalizacion.module";
// import { FacturacionModule } from "./facturacion/facturacion.module";
import { PromocionesModule } from "./promociones/promociones.module";
// import { FavoritosModule } from "./favoritos/favoritos.module";

// Guards y middlewares
import { RolesGuard } from "./auth/guards/roles.guard";
import { SessionValidationMiddleware } from "./auth/middlewares/session-validation.middleware";

// Configuration
import databaseConfig from "./config/database.config";
import authConfig from "./config/auth.config";
import appConfig from "./config/app.config";
import { TypeOrmConfigService } from "./database/typeorm-config.service";
import mailerConfig from "./config/mailer.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig, appConfig, mailerConfig],
      envFilePath: [".env"],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),

    JwtModule.register({
      global: true,
    }),

    // Core modules
    AuthModule,
    UsersModule,
    SessionModule,
    MailsModule,
    ForgotPasswordModule,

    // Business modules
    ProductosModule,
    PedidosModule,
    // CarritoModule,
    // ChatModule,
    // PersonalizacionModule,
    // FacturacionModule,
    PromocionesModule,
    // FavoritosModule,
  ],
  providers: [
    // Guard global para roles (se aplicará automáticamente después de JWT)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplicar middleware de validación de sesión a todas las rutas
    consumer.apply(SessionValidationMiddleware).forRoutes("*");
  }
}
