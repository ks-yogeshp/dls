import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import type { IActiveUser } from 'src/auth/interfaces/active-user.interface';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { QueryDto } from 'src/common/dtos/query.dto';
import { QueryDtoPipe } from 'src/common/query/pipes/queryDtoPipe';
import { Book } from 'src/database/schemas/book.schema';
import { Role } from 'src/database/schemas/enums/role.enum';
import { BookDtoDemo, CreateBookInput, DetailedBookDtoDemo, PaginatedBooks, UpdateBookInput } from './dto/book.dto';
import { BooksService } from './services/books.service';
import { SuccessDto } from './dto/success.dto';
import { BorrowRecordDtoDemo } from './dto/borrow-record.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { ExtendDto } from './dto/extend.dto';
import { ReservationRequestDtoDemo } from './dto/reservation-request.dto';

@Resolver(() => BookDtoDemo)
export class BooksResolver {
  constructor(private readonly bookService: BooksService) {}

  @Auth()
  @Query(() => PaginatedBooks)
  public async getAllBooks(
    @ActiveUser() user: IActiveUser,
    @Args('query', { nullable: true }, new QueryDtoPipe(Book)) queryDto: QueryDto
  ) {
    const books = await this.bookService.getAllBooks(queryDto);
    const result = books.result.map((book) => new BookDtoDemo(book, user.role));
    return new PaginatedBooks(result, queryDto.page, queryDto.limit, books.totalItems, books.newUrl);
  }

  @Auth()
  @Query(() => DetailedBookDtoDemo)
  public async getBookById(@Args('id') id: string, @ActiveUser() user: IActiveUser) {
    const book = await this.bookService.getBookById(id);
    return new DetailedBookDtoDemo(book, user.role);
  }

  @Auth({
    roles: [Role.ADMIN, Role.MANAGER],
  })
  @Mutation(() => DetailedBookDtoDemo)
  public async createBook(
    @ActiveUser() user: IActiveUser,
    @Args('createBookInput') createBookInput: CreateBookInput
  ) {
    const book = await this.bookService.createBook(createBookInput, user);
    return new DetailedBookDtoDemo(book, user.role);
  }

  @Auth({
    roles: [Role.ADMIN, Role.MANAGER],
  })
  @Mutation(() => DetailedBookDtoDemo)
  public async updateBook(
    @Args('id') id: string,
    @ActiveUser() user: IActiveUser,
    @Args('updateBookInput') updateBookInput: UpdateBookInput
  ) {
    const book = await this.bookService.updateBook(id, user, updateBookInput);
    return new DetailedBookDtoDemo(book, user.role);
  }

  @Auth({
    roles: [Role.ADMIN],
  })
  @Mutation(() => SuccessDto)
  public deleteBook(@Args('id') id: string, @ActiveUser() user: IActiveUser) {
    return this.bookService.deleteBook(id, user);
  }

  @Auth({
    roles: [Role.STUDENT],
  })
  @Mutation(() => BorrowRecordDtoDemo)
  public async bookCheckout(
    @Args('id') id: string,
    @ActiveUser() user: IActiveUser,
    @Args('checkoutBook') checkoutBook: CheckoutDto
  ) {
    const record = await this.bookService.bookCheckout(id, user, checkoutBook);
    return new BorrowRecordDtoDemo(record);
  }

  @Auth({
    roles: [Role.STUDENT],
  })
  @Mutation(() => BorrowRecordDtoDemo)
  public async bookReturn(@Args('id') id: string, @ActiveUser() user: IActiveUser) {
    const record = await this.bookService.bookReturn(id, user);
    return new BorrowRecordDtoDemo(record);
  }

  @Auth({
    roles: [Role.STUDENT],
  })
  @Mutation(() => BorrowRecordDtoDemo)
  public async extendBook(
    @Args('id') id: string,
    @ActiveUser() user: IActiveUser,
    @Args('extendBook') extendDto: ExtendDto
  ) {
    const record = await this.bookService.extendBook(id, user, extendDto);
    return new BorrowRecordDtoDemo(record);
  }

  @Auth({
    roles: [Role.STUDENT],
  })
  @Mutation(() => ReservationRequestDtoDemo)
  public async createReservationResquest(@Args('id') id: string, @ActiveUser() user: IActiveUser) {
    const reservation = await this.bookService.createReservation(id, user);
    return new ReservationRequestDtoDemo(reservation);
  }
}
