import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { MyEntityMap } from 'src/app.types';
import { QueryDto } from 'src/common/dtos/query.dto';
import { QueryService } from 'src/common/query/query.service';
import { UserRepository } from 'src/database/repositories/user.repository';
import { User } from 'src/database/schemas/user.schema';
import { CreateUserDto, UpdateUserInput } from '../dto/user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private readonly userRepository: UserRepository,

    private readonly queryProvider: QueryService
  ) {}

  public async getAllUsers(queryDto: QueryDto) {
    return this.queryProvider.query<User, MyEntityMap>({
      query: queryDto,
      model: this.userRepository.query(),
      searchFieldMap: {
        User: ['firstName', 'lastName', 'email'],
      },
    });
  }

  public async getUserById(id: Types.ObjectId) {
    const user = await this.userRepository
      .query()
      .findById(id)
      .populate(['borrowRecord', 'reservationRequest'])
      .exec();
    if (!user) throw new NotFoundException('User not Found');

    return user;
  }

  public async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.query().findOne({ email: createUserDto.email });
    if (existingUser) throw new BadRequestException('User already exists with this email');

    const newUser = new User();
    newUser.firstName = createUserDto.firstName;
    newUser.lastName = createUserDto.lastName;
    newUser.email = createUserDto.email;
    newUser.password = createUserDto.password;
    newUser.role = createUserDto.role;

    return this.userRepository.query().insertOne(newUser);
  }

  public async updateUser(id: Types.ObjectId, updateUserInput: UpdateUserInput) {
    const existingUser = await this.userRepository.query().findById(id);

    if (!existingUser) throw new NotFoundException('User does not exist with this Id');

    existingUser.firstName = updateUserInput.firstName ?? existingUser.firstName;
    existingUser.lastName = updateUserInput.lastName ?? existingUser.lastName;

    return await existingUser.save();
  }

  public async deleteUser(id: Types.ObjectId) {
    const userToDelete = await this.userRepository.query().findById(id);

    if (!userToDelete) throw new NotFoundException('User does not exist with this Id');
    await this.userRepository.softDeleteById(id);

    return { message: 'User deleted successfully' };
  }
}
