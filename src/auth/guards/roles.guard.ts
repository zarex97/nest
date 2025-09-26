import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RequestWithUser } from "../types/request-with-user.type";
import { UserRole } from "src/users/entities/user.entity";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      "roles",
      [context.getHandler(), context.getClass()]
    );

    // Si no hay roles requeridos, permitir acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    console.log("🔍 RolesGuard - Required roles:", requiredRoles);
    console.log("🔍 RolesGuard - User:", user);

    if (!user) {
      throw new UnauthorizedException("Authentication required");
    }

    if (!user.role) {
      throw new UnauthorizedException("User role not found");
    }

    // Verificar si el usuario tiene alguno de los roles requeridos
    const hasRequiredRole = requiredRoles.some((role) => user.role === role);

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(", ")}`
      );
    }

    return true;
  }
}
