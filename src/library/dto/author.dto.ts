import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { PickType } from '@nestjs/swagger';
import { Types } from 'mongoose';

import type { AuthorDocument } from 'src/database/schemas/author.schema';
import { Role } from 'src/database/schemas/enums/role.enum';
import {
  EmailField,
  ObjectFieldOptional,
  StringField,
  StringFieldOptional,
} from '../../common/decorators/field.decorators';
import { BookDto, BookDtoDemo } from './book.dto';
import { MetadataSoftDto } from './metadata-soft.dto';
import { Paginated } from 'src/common/dtos/page.dto';

export class AuthorDto extends MetadataSoftDto {
  @StringField({
    description: 'Unique identifier for the user',
    example: '64b2f3c1b5d9a6a1e2d3f4b5',
  })
  id: string;

  @StringField({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  name: string;

  @EmailField({
    description: 'Email address of the user',
    example: 'john@example.com',
  })
  email: string;

  @StringFieldOptional({
    description: 'Country of the user',
    example: 'USA',
  })
  country?: string;

  constructor(author: AuthorDocument, role?: Role) {
    super(author, role);
    this.id = author.id;
    this.name = author.name;
    this.email = author.email;
    this.country = author.country;
  }
}

export class CreateAuthorDto extends PickType(AuthorDto, ['name', 'email', 'country']) {}

export class UpdateAuthorDto extends PickType(AuthorDto, ['name', 'country']) {}

export class DetailedAuthorDto extends AuthorDto {
  @ObjectFieldOptional(() => BookDto, {
    description: 'List of books associated with the user',
    isArray: true,
    each: true,
  })
  books?: (string | BookDto)[];

  constructor(author: AuthorDocument, role?: Role) {
    super(author, role);
    this.books = author.books?.map((book) =>
      book instanceof Types.ObjectId ? book.toString() : new BookDto(book, role)
    );
  }
}

// import { Types } from 'mongoose';
// import { MetadataSoftDto } from './metadata-soft.dto';
// import { BookDto } from './book.dto';
// import { Role } from 'src/database/schemas/enums/role.enum';
// import { AuthorDocument } from 'src/database/schemas/author.schema';

@ObjectType()
export class AuthorDtoDemo extends MetadataSoftDto {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  country?: string;

  constructor(author: AuthorDocument, role?: Role) {
    super(author, role);
    this.id = author.id;
    this.name = author.name;
    this.email = author.email;
    this.country = author.country;
  }
}

@InputType()
export class CreateAuthorInput {
  @Field()
  name: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  country?: string;
}

@InputType()
export class UpdateAuthorInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  country?: string;
}

@ObjectType()
export class DetailedAuthorDtoDemo extends AuthorDto {
  @Field(() => [BookDtoDemo], { nullable: 'itemsAndList' })
  books?: (string | BookDtoDemo)[];

  constructor(author: AuthorDocument, role?: Role) {
    super(author, role);
    this.books = author.books?.map((book) =>
      book instanceof Types.ObjectId ? book.toString() : new BookDtoDemo(book, role)
    );
  }
}

@ObjectType()
export class PaginatedAuthors extends Paginated(AuthorDtoDemo) {}
