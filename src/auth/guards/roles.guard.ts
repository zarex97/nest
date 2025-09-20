import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RequestWithUser } from "../types/request-with-user.type"; // 👈 Import custom type

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>("roles", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>(); // 👈 Use typed request
    const user = request.user;

    if (!user || !user.role) {
      throw new UnauthorizedException("User role not found");
    }

    if (!requiredRoles.includes(user.role)) {
      throw new UnauthorizedException("Insufficient permissions");
    }

    return true;
  }
}
