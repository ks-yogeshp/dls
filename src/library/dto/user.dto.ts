import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { PickType } from '@nestjs/swagger';
import { Types } from 'mongoose';

import { Role } from 'src/database/schemas/enums/role.enum';
import * as userSchema from 'src/database/schemas/user.schema';
import {
  EmailField,
  EnumField,
  NumberField,
  ObjectFieldOptional,
  PasswordField,
  StringField,
  StringFieldOptional,
} from '../../common/decorators/field.decorators';
import { AbstractSoftDto } from './abstract-soft.dto';
import { BorrowRecordDto, BorrowRecordDtoDemo } from './borrow-record.dto';
import { ReservationRequestDto, ReservationRequestDtoDemo } from './reservation-request.dto';
import { Paginated } from 'src/common/dtos/page.dto';

export type IUserDtoWithPenalty = UserDto & { totalPenalty: number };

export class UserDto extends AbstractSoftDto {
  @StringField({
    description: 'Unique identifier for the user',
    example: '64b2f3c1b5d9a6a1e2d3f4b5',
  })
  id: string;

  @StringField({
    description: 'First name of the user',
    example: 'John',
  })
  firstName: string;

  @StringFieldOptional({
    description: 'Last name of the user',
    example: 'Doe',
  })
  lastName?: string;

  @EmailField({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  email: string;

  @EnumField(() => Role, {
    description: 'Role of the user in the system',
    example: Role.STUDENT,
  })
  role: Role;

  constructor(user: userSchema.UserDocument, role?: Role) {
    super(user, role);
    this.id = user.id;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
    this.role = user.role ?? Role.STUDENT;
  }
}

export class CreateUserDto extends PickType(UserDto, ['firstName', 'lastName', 'email', 'role']) {
  @PasswordField({
    description: 'Password for the user account',
    example: 'StrongP@ssw0rd!',
  })
  password: string;
}

export class UpdateUserDto extends PickType(UserDto, ['firstName', 'lastName']) {}

export class UserDtoWithPenalty extends UserDto {
  @NumberField({
    description: 'Total penalty amount for the user',
    example: 15,
    isPositive: true,
  })
  totalPenalty: number;
  constructor(user: userSchema.IUserWithPenalty) {
    super(user);
    this.totalPenalty = user.totalPenalty;
  }
}

export class DetailedUserDto extends UserDto {
  @ObjectFieldOptional(() => BorrowRecordDto, {
    description: 'History of borrowing records for the user',
    isArray: true,
    each: true,
  })
  borrowingHistory?: (string | BorrowRecordDto)[];

  @ObjectFieldOptional(() => ReservationRequestDto, {
    description: 'History of reservation requests for the user',
    isArray: true,
    each: true,
  })
  reservationHistory?: (string | ReservationRequestDto)[];

  constructor(user: userSchema.UserDocument) {
    super(user);
    this.borrowingHistory = user.borrowRecord?.map((borrowHistory) =>
      borrowHistory instanceof Types.ObjectId ? borrowHistory.toString() : new BorrowRecordDto(borrowHistory)
    );
    this.reservationHistory = user.reservationRequest?.map((reservationHistory) =>
      reservationHistory instanceof Types.ObjectId
        ? reservationHistory.toString()
        : new ReservationRequestDto(reservationHistory)
    );
  }
}

// import { Role } from 'src/database/schemas/enums/role.enum';
// import { BorrowRecordDtoGraph } from './borrow-record.dto.graph';
// import { ReservationRequestDtoGraph } from './reservation-request.dto.graph';
// import { UserDocument, IUserWithPenalty } from 'src/database/schemas/user.schema';

@ObjectType()
export class UserDtoDemo extends AbstractSoftDto {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field()
  email: string;

  @Field(() => Role)
  role: Role;

  constructor(user: userSchema.UserDocument, role?: Role) {
    super(user, role);
    this.id = user.id;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.email = user.email;
    this.role = user.role ?? Role.STUDENT;
  }
}

@ObjectType()
export class UserDtoWithPenaltyDemo extends UserDtoDemo {
  @Field()
  totalPenalty: number;

  constructor(user: userSchema.IUserWithPenalty) {
    super(user);
    this.totalPenalty = user.totalPenalty;
  }
}

@ObjectType()
export class DetailedUserDtoDemo extends UserDtoDemo {
  @Field(() => [BorrowRecordDtoDemo], { nullable: 'itemsAndList' })
  borrowingHistory?: (string | BorrowRecordDtoDemo)[];

  @Field(() => [ReservationRequestDtoDemo], { nullable: 'itemsAndList' })
  reservationHistory?: (string | ReservationRequestDtoDemo)[];

  constructor(user: userSchema.UserDocument) {
    super(user);
    this.borrowingHistory = user.borrowRecord?.map((borrowHistory) =>
      borrowHistory instanceof Types.ObjectId
        ? borrowHistory.toString()
        : new BorrowRecordDtoDemo(borrowHistory)
    );
    this.reservationHistory = user.reservationRequest?.map((reservationHistory) =>
      reservationHistory instanceof Types.ObjectId
        ? reservationHistory.toString()
        : new ReservationRequestDtoDemo(reservationHistory)
    );
  }
}
@InputType()
export class CreateUserInputGraph {
  @Field()
  firstName: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field()
  email: string;

  @Field(() => Role, { defaultValue: Role.STUDENT })
  role: Role;

  @Field()
  password: string;
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;
}

@ObjectType()
export class PaginatedUsers extends Paginated(UserDtoDemo) {}
