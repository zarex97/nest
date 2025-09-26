import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Inject,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { ISessionService } from "src/session/session";
import { Services } from "src/utils/constants";
import { AllConfigType } from "src/config/config.type";

@Injectable()
export class SessionValidationMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService<AllConfigType>,
    @Inject(Services.SESSION) private readonly sessionService: ISessionService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // Continuar sin validar si no hay token
    }

    try {
      const token = authHeader.substring(7);
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>("auth.secret", { infer: true }),
      });

      if (payload.sessionId) {
        // Verificar que la sesión existe y está activa
        const session = await this.sessionService.findOne({
          where: { id: payload.sessionId },
        });

        if (!session) {
          throw new UnauthorizedException("Session expired or invalid");
        }

        // La sesión es válida, continuar
        req["sessionValidated"] = true;
      }
    } catch (error) {
      // Si hay error al validar la sesión, invalidar el token
      throw new UnauthorizedException("Invalid or expired session");
    }

    next();
  }
}
