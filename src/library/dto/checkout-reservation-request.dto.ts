import { Field, InputType, Int } from '@nestjs/graphql';
import { NumberFieldOptional } from '../../common/decorators/field.decorators';

@InputType()
export class CheckoutReservationRequestDto {
  @Field(() => Int, { description: 'Number of days the book will be borrowed', defaultValue: 14 })
  @NumberFieldOptional({
    description: 'Number of days the book will be borrowed',
    example: 14,
    int: true,
    minimum: 1,
    maximum: 14,
  })
  days: number = 14;
}
