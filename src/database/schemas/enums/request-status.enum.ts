import { registerEnumType } from '@nestjs/graphql';

export enum RequestStatus {
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  APPROVED = 'approved',
  FULFILLED = 'fulfilled',
  EXPIRE = 'expire',
}
registerEnumType(RequestStatus, {
  name: 'RequestStatus',
  description: 'The status of a request in the system',
});