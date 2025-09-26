import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { DeepPartial, Repository } from "typeorm";
import { User, UserStatus, UserRole } from "./entities/user.entity"; // Import UserRole
import { InjectRepository } from "@nestjs/typeorm";
import { CreateUserDto } from "./dtos/create-user.dto";
import { EntityCondition } from "src/utils/types/entity-condition.type";
import { NullableType } from "src/utils/types/nullable.type";
import { IPaginationOptions } from "src/utils/types/pagination-options";
import { IUsersService } from "./users";

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser)
      throw new HttpException("User already exists", HttpStatus.CONFLICT);
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  findOneUser(options: EntityCondition<User>): Promise<NullableType<User>> {
    // Handle both object and array conditions
    const where = Array.isArray(options) ? options : [options];

    return this.usersRepository.findOne({
      where: where.map((condition) => ({
        email: condition.email,
        id: condition.id,
        hash: condition.hash,
        // Add other fields as needed
      })),
      select: {
        id: true,
        email: true,
        password: true,
        provider: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true,
        phone: true,
        hash: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAllUsers(): Promise<User[]> {
    return this.usersRepository.find();
  }

  // Fix: Change parameter type from string to UserRole
  async updateUserRole(id: number, role: UserRole): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    }
    user.role = role;
    return this.usersRepository.save(user);
  }

  async updateUserStatus(
    id: number,
    status: "active" | "inactive"
  ): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    }
    user.status = status === "active" ? UserStatus.Active : UserStatus.Inactive;
    return this.usersRepository.save(user);
  }

  findUsersWithPagination(
    paginationOptions: IPaginationOptions
  ): Promise<User[]> {
    return this.usersRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });
  }

  updateUser(id: User["id"], payload: DeepPartial<User>): Promise<User> {
    return this.usersRepository.save(
      this.usersRepository.create({
        id,
        ...payload,
      })
    );
  }

  async deleteUser(id: User["id"]): Promise<void> {
    await this.usersRepository.softDelete(id);
  }

  async saveUser(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }
}
