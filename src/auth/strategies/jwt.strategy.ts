import { ExtractJwt, Strategy } from "passport-jwt";
import { Injectable, UnauthorizedException, Inject } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { OrNeverType } from "../../utils/types/or-never.type";
import { AllConfigType } from "src/config/config.type";
import { JwtPayloadType } from "./types/jwt-payload.type";
import { IUsersService } from "src/users/users";
import { Services } from "src/utils/constants";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    private configService: ConfigService<AllConfigType>,
    @Inject(Services.USERS) private readonly usersService: IUsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("auth.secret", {
        infer: true,
      }),
    });
  }

  public async validate(
    payload: JwtPayloadType
  ): Promise<OrNeverType<JwtPayloadType>> {
    if (!payload.id) {
      throw new UnauthorizedException("Invalid token payload");
    }

    // Cargar el usuario completo para obtener el rol actualizado
    const user = await this.usersService.findOneUser({ id: payload.id });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Retornar el payload con el rol actualizado del usuario
    return {
      id: user.id,
      sessionId: payload.sessionId,
      role: user.role, // Rol actualizado desde la base de datos
      email: user.email,
    };
  }
}
