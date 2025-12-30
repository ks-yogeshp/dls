import { Field, InputType, Int } from '@nestjs/graphql';
import { DateFieldOptional, NumberFieldOptional } from '../../common/decorators/field.decorators';

@InputType()
export class PenaltySummaryDto {
  @Field({ nullable: true })
  @DateFieldOptional({
    description: 'Start date for filtering penalties (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  start?: string;

  @Field({ nullable: true })
  @DateFieldOptional({
    description: 'End date for filtering penalties (YYYY-MM-DD)',
    example: '2025-12-31',
  })
  end?: string;

  @Field(()=> Int, { nullable: true })
  @NumberFieldOptional({
    description: 'Number of user',
    example: 10,
    int: true,
    minimum: 1,
  })
  limit?: number;
}
