import { Types } from 'mongoose';

import * as borrowRecordSchema from 'src/database/schemas/borrow-record.schema';
import { BookStatus } from 'src/database/schemas/enums/book-status.enum';
import { Role } from 'src/database/schemas/enums/role.enum';
import {
  BooleanFieldOptional,
  DateField,
  EnumField,
  NumberField,
  StringField,
  StringFieldOptional,
} from '../../common/decorators/field.decorators';
import { AbstractSoftDto } from './abstract-soft.dto';
import { BookDtoDemo } from './book.dto';
import { UserDtoDemo } from './user.dto';

export class BorrowRecordDto extends AbstractSoftDto {
  @StringField({
    description: 'Unique identifier for the borrow record',
    example: '64b2f3c1b5d9a6a1e2d3f4b5',
  })
  id: string;

  @StringFieldOptional({
    description: 'Unique identifier for the book',
    example: '64b2f3c1b5d9a6a1e2d3f4b5',
  })
  book?: string | BookDtoDemo;

  @StringFieldOptional({
    description: 'Unique identifier for the user',
    example: '64b2f3c1b5d9a6a1e2d3f4b5',
  })
  user?: string | UserDtoDemo;

  @DateField({
    description: 'Date when the book was borrowed',
    example: '2024-01-15',
  })
  borrowDate: Date;

  @DateField({
    description: 'Due date for returning the book',
    example: '2024-02-15',
  })
  dueDate: Date;

  @DateField({
    description: 'Date when the book was returned',
    example: '2024-02-10',
  })
  returnDate?: Date;

  @NumberField({
    description: 'Penalty amount for late return',
    example: 5,
    isPositive: true,
  })
  penalty?: number;

  @BooleanFieldOptional({
    description: 'Indicates if the penalty has been paid',
    example: true,
  })
  penaltyPaid?: boolean;

  @NumberField({
    description: 'Number of times the borrow period has been extended',
    example: 1,
    int: true,
    minimum: 0,
    maximum: 3,
  })
  extensionCount: number;

  @EnumField(() => BookStatus, {
    description: 'Current status of the book',
    example: BookStatus.BORROWED,
  })
  bookStatus: BookStatus;

  constructor(borrowRecord: borrowRecordSchema.BorrowRecordDocument, role?: Role) {
    super(borrowRecord, role);
    this.id = borrowRecord.id;
    this.user = borrowRecord.user
      ? borrowRecord.user instanceof Types.ObjectId
        ? borrowRecord.user.toString()
        : new UserDtoDemo(borrowRecord.user)
      : undefined;
    this.book = borrowRecord.book
      ? borrowRecord.book instanceof Types.ObjectId
        ? borrowRecord.book.toString()
        : new BookDtoDemo(borrowRecord.book, role)
      : undefined;
    this.borrowDate = borrowRecord.borrowDate;
    this.dueDate = borrowRecord.dueDate;
    this.penalty = borrowRecord.penalty;
    this.penaltyPaid = borrowRecord.penaltyPaid;
    this.extensionCount = borrowRecord.extensionCount;
    this.bookStatus = borrowRecord.bookStatus;
    this.returnDate = borrowRecord.returnDate;
  }
}
import { Field, ID, ObjectType, Int } from '@nestjs/graphql';
// import { BookDto } from './book.dto';
// import { UserDto } from './user.dto';
// import { BorrowRecordDocument } from 'src/database/schemas/borrow-record.schema';
// import { Role } from 'src/database/schemas/enums/role.enum';
// import { BookStatus } from 'src/database/schemas/enums/book-status.enum';

@ObjectType()
export class BorrowRecordDtoDemo {
  @Field(() => ID)
  id: string;

  @Field(() => BookDtoDemo, { nullable: true })
  book?: BookDtoDemo;

  @Field(() => UserDtoDemo, { nullable: true })
  user?: UserDtoDemo;

  @Field()
  borrowDate: Date;

  @Field()
  dueDate: Date;

  @Field({ nullable: true })
  returnDate?: Date;

  @Field(() => Int, { nullable: true })
  penalty?: number;

  @Field({ nullable: true })
  penaltyPaid?: boolean;

  @Field(() => Int)
  extensionCount: number;

  @Field(() => BookStatus)
  bookStatus: BookStatus;

  constructor(borrowRecord: borrowRecordSchema.BorrowRecordDocument, role?: Role) {
    this.id = borrowRecord.id;
    this.user = borrowRecord.user
      ? borrowRecord.user instanceof Object
        ? !(borrowRecord.user instanceof Types.ObjectId)
          ? new UserDtoDemo(borrowRecord.user)
          : undefined
        : undefined
      : undefined;
    this.book = borrowRecord.book
      ? borrowRecord.book instanceof Object
        ? !(borrowRecord.book instanceof Types.ObjectId)
          ? new BookDtoDemo(borrowRecord.book, role)
          : undefined
        : undefined
      : undefined;
    this.borrowDate = borrowRecord.borrowDate;
    this.dueDate = borrowRecord.dueDate;
    this.returnDate = borrowRecord.returnDate;
    this.penalty = borrowRecord.penalty;
    this.penaltyPaid = borrowRecord.penaltyPaid;
    this.extensionCount = borrowRecord.extensionCount;
    this.bookStatus = borrowRecord.bookStatus;
  }
}
