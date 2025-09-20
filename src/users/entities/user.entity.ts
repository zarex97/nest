import {
  Column,
  AfterLoad,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";

import { EntityHelper } from "src/utils/entity-helper";

import { Exclude } from "class-transformer";
import { AuthProvidersEnum } from "src/auth/enums/auth-providers.enum";
import { hashPassword } from "src/utils/helpers";

export enum UserStatus {
  Active = "active",
  Inactive = "inactive",
}

@Entity("usuario")
export class User extends EntityHelper {
  @PrimaryGeneratedColumn({ name: "id_usuario" })
  id: number;


  @Column({ type: String, unique: true, nullable: false, name: "email" })
  email: string;

  @Column({ name: "contrasena", type: "varchar", length: 255, nullable: false })
  @Exclude({ toPlainOnly: true })
  password: string;

  @Exclude({ toPlainOnly: true })
  public previousPassword: string;

  @AfterLoad()
  public loadPreviousPassword(): void {
    this.previousPassword = this.password;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async setPassword() {
    if (this.previousPassword !== this.password && this.password) {
      this.password = await hashPassword(this.password);
    }
  }

  @Column({
    name: "provider",
    type: "enum",
    enum: AuthProvidersEnum,
    default: AuthProvidersEnum.email,
  })
  provider: string;

  @Column({
    name: "tipo_rol",
    type: "enum",
    enum: ["admin", "cliente", "empleado", "diseñador"],
    default: "cliente",
  })
  role: string; // You can name this 'role' in code for clarity

  @Column({ type: "enum", enum: UserStatus, default: UserStatus.Inactive })
  status: UserStatus;

  @Index()
  @Column({
    name: "numero_documento",
    type: "varchar",
    length: 11,
    nullable: false,
  })
  socialId: string | null;

  @Index()
  @Column({ name: "nombre", type: "varchar", length: 100, nullable: false })
  firstName: string | null;

  @Index()
  @Column({ name: "apellido", type: "varchar", length: 100, nullable: false })
  lastName: string | null;

  @Column({
    name: "tipo_rol",
    type: "enum",
    enum: ["admin", "cliente", "empleado", "diseñador"],
    default: "cliente",
  })
  role: string;

  @Column({ name: "ultimo_acceso", type: "datetime", nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn({
    name: "fecha_creacion",
    type: "datetime",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @Column({ type: String, nullable: true })
  @Index()
  @Exclude({ toPlainOnly: true })
  hash: string | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
