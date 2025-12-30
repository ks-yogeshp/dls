import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsObject, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';
import { FilterOperatorValueDto } from './filter-operator-value.dto';
import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class QueryDto {

  @Field(() => Int, { defaultValue: 1, description: 'Page number for pagination' })
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page: number = 1;

  @Field(() => Int, { defaultValue: 10, description: 'Number of items per page' })
  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @Field({ nullable: true, description: 'Search keyword (applies to name, title, etc.)' })
  @ApiPropertyOptional({
    description: 'Search keyword (applies to name, title, etc.)',
    example: 'gatsby',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @Field({ nullable: true, description: 'Field to sort results by' })
  @ApiPropertyOptional({
    description: 'Field to sort results by',
    example: 'yearOfPublication',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @Field({ nullable: true, description: 'Sort order (ASC or DESC)' })
  @ApiPropertyOptional({
    description: 'Sort order (ASC or DESC)',
    example: 'ASC',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @Field(() => GraphQLJSON, { nullable: true, description: 'Filters object. (e.g., filters[category][eq]=FICTION)' })
  @ApiPropertyOptional({
    description: 'Filters object. (e.g., filters[category][eq]=FICTION)',
    type: 'object',
    example: {
      category: { eq: 'FICTION' },
      yearOfPublication: { gt: 2020 },
    },
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  filters?: Record<string, FilterOperatorValueDto>;
}
