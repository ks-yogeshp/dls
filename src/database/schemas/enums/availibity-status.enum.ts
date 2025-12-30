import { registerEnumType } from '@nestjs/graphql';

export enum AvailabilityStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
}
registerEnumType(AvailabilityStatus, {
  name: 'AvailabilityStatus',
  description: 'The current availability status of the book',
});
