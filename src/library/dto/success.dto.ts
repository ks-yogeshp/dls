import { Field, ObjectType } from '@nestjs/graphql';
import { BooleanField } from '../../common/decorators/field.decorators';

@ObjectType()
export class SuccessDto {

  @Field(() => Boolean, { description: 'Indicates whether the operation was successful' })
  @BooleanField()
  success: boolean;

  constructor(success: boolean = true) {
    this.success = success;
  }
}
