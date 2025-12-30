import { StringField } from 'src/common/decorators/field.decorators';

export class LoginDto {
  @StringField({
    description: 'User email',
    example: 'jondoe@gmail.com',
  })
  email: string;

  @StringField({
    description: 'User password',
    example: 'password',
  })
  password: string;
}
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class LoginInput {
  @Field({
    description: 'User email',
  })
  email: string;

  @Field({
    description: 'User password',
  })
  password: string;
}
