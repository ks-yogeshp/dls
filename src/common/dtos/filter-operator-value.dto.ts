import { Field, InputType } from '@nestjs/graphql';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import * as _ from 'lodash';

@InputType()
export class FilterOperatorValueDto {
  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Equals', example: 'FICTION' })
  @IsOptional()
  @IsString()
  eq?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Greater than', example: '2020' })
  @IsOptional()
  @IsString()
  gt?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Greater than or equal',
    example: '2020',
  })
  @IsOptional()
  @IsString()
  gte?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Less than', example: '2024' })
  @IsOptional()
  @IsString()
  lt?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Less than or equal', example: '2024' })
  @IsOptional()
  @IsString()
  lte?: string;

  // @ApiPropertyOptional({ description: 'Not equals', example: 'NON_FICTION' })
  // @IsOptional()
  // @IsString()
  // not?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Case-sensitive like',
    example: 'Gatsby',
  })
  @IsOptional()
  @IsString()
  like?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({
    description: 'Case-insensitive like',
    example: 'gatsby',
  })
  @IsOptional()
  @IsString()
  ilike?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Is null', example: 'true' })
  @IsOptional()
  @IsIn(['true', 'false'])
  isNull?: string;

  @Field(()=> [String],{ nullable: true })
  @ApiPropertyOptional({
    description: 'In array',
    example: ['ACTIVE', 'PENDING'],
    // isArray: true,
  })
  @Transform(ToStringArray())
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  in?: string[];

  @Field(()=> [String],{ nullable: true })
  @ApiPropertyOptional({
    description: 'In array',
    example: ['ACTIVE', 'PENDING'],
    // isArray: true,
  })
  @Transform(ToStringArray())
  @IsOptional()
  // @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  any?: string[];

  @Field(()=> [String],{ nullable: true })
  @ApiPropertyOptional({
    description: 'Between two values',
    example: ['2010', '2020'],
    isArray: true,
  })
  @Transform(ToStringArray())
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @Type(() => String)
  between?: string[];

  // @ApiPropertyOptional({
  //   description: 'Array contains value (for PostgreSQL arrays)',
  //   example: 'ADMIN',
  // })
  // @IsOptional()
  // @IsString()
  // contains?: string;
}
export function ToStringArray() {
  return ({ value }: { value: any }) => {
    if (!value) return undefined;

    if (_.isArray(value)) {
      // trim and remove empty strings
      return _.compact(_.map(value, (v) => _.trim(v)));
    }

    if (_.isString(value)) {
      return _.compact(_.map(value.split(','), (v) => _.trim(v)));
    }

    return undefined;
  };
}