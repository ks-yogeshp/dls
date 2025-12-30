import { Transform } from 'class-transformer';

import { Category } from 'src/database/schemas/enums/category.enum';
import {
  DateFieldOptional,
  EnumFieldOptional,
  NumberFieldOptional,
} from '../../common/decorators/field.decorators';
import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class BookActivitySummaryDto {

  @Field(()=> Int,{ nullable: true })
  @NumberFieldOptional({
    description: 'Filter by year (e.g., 2025)',
    example: 2025,
    int: true,
    minimum: 1900,
  })
  year?: number;

  @Field(()=> Int,{ nullable: true })
  @NumberFieldOptional({
    description: 'Filter by month (1-12)',
    example: 5,
    int: true,
    minimum: 1,
    maximum: 12,
  })
  month?: number;

  @Field({ nullable: true })
  @DateFieldOptional({
    description: 'Start date for filtering (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  startDate?: string;

  @Field({ nullable: true })
  @DateFieldOptional({
    description: 'End date for filtering (YYYY-MM-DD)',
    example: '2025-12-31',
  })
  endDate?: string;

  @Field(() => [Category], { nullable: 'itemsAndList' })
  @EnumFieldOptional(() => Category, {
    description: 'Filter by one or more book categories',
    example: [Category.FICTION, Category.SCIENCE],
    isArray: true,
    each: true,
  })
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value.split(','); // split comma-separated string into array
  })
  categoryIds?: Category[];

  @Field(()=> Int,{ nullable: true })
  @NumberFieldOptional({
    description: 'Limit number of top borrowed books (e.g., 10)',
    example: 10,
    int: true,
    isPositive: true,
  })
  limit?: number;
}
