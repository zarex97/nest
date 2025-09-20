import { Request } from "express";
import { User } from "src/users/entities/user.entity";

export interface RequestWithUser extends Request {
  user: {
    id: number;
    role: string; // this is for the roles.guard.ts
    sessionId?: string;
  };
}
