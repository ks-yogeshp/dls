import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';
import { DatabaseModule } from 'src/database/database.module';
import { AuthorsResolver } from './authors.resolver';
import { BooksResolver } from './books.resolver';
import { AuthorsService } from './services/authors.service';
import { BookCheckoutService } from './services/book-checkout.service';
import { BookExtendService } from './services/book-extend.service';
import { BookReserveService } from './services/book-reserve.service';
import { BookReturnService } from './services/book-return.service';
import { BooksService } from './services/books.service';
import { BorrowRecordService } from './services/borrow-record.service';
import { ReservationRequestService } from './services/reservation-request.service';
import { UsersService } from './services/users.service';
import { UsersResolver } from './users.resolver';
import { BorrowRecordResolver } from './borrow-record.resolver';
import { ReservationRequestResolver } from './reservation-request.resolver';

@Module({
  imports: [DatabaseModule.forRoot(), forwardRef(() => AuthModule)],
  providers: [
    AuthorsService,
    BooksService,
    BookCheckoutService,
    BookReturnService,
    BookExtendService,
    BookReserveService,
    UsersService,
    BorrowRecordService,
    ReservationRequestService,
    BooksResolver,
    AuthorsResolver,
    UsersResolver,
    BorrowRecordResolver,
    ReservationRequestResolver
  ],
  exports: [ReservationRequestService, UsersService],
})
export class LibraryModule {}
