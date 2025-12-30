import { registerEnumType } from '@nestjs/graphql';

export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STUDENT = 'student',
}
registerEnumType(Role, {
  name: 'Role',
  description: 'Role of the user in the system',
});
