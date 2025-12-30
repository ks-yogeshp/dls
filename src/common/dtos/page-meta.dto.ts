import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType()
export class PageMetaDto {

  @Field(() => Int)
  @ApiProperty({
    example: 10,
    description: 'Number of items per page',
  })
  readonly itemsPerPage: number;

  @Field(() => Int)
  @ApiProperty({
    example: 95,
    description: 'Total number of items',
  })
  readonly totalItems: number;

  @Field(() => Int)
  @ApiProperty({
    example: 3,
    description: 'Current page number',
  })
  readonly currentPage: number;

  @Field(() => Int)
  @ApiProperty({
    example: 10,
    description: 'Total number of pages',
  })
  readonly totalPages: number;

  constructor(page, limit, count) {
    this.totalItems = count;
    this.itemsPerPage = limit;
    this.totalPages = Math.max(Math.ceil(count / limit), 1);
    this.currentPage = page < 1 ? 1 : page;
  }
}
