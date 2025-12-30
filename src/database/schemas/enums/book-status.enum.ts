import { registerEnumType } from "@nestjs/graphql";

export enum BookStatus {
  BORROWED = 'borrowed',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
}
registerEnumType(BookStatus, {
  name: 'BookStatus',
  description: 'The current status of the book',
});
