import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Connection, Types } from 'mongoose';

import { MyEntityMap } from 'src/app.types';
import { IActiveUser } from 'src/auth/interfaces/active-user.interface';
import { QueryDto } from 'src/common/dtos/query.dto';
import { QueryService } from 'src/common/query/query.service';
import { AuthorRepository } from 'src/database/repositories/author.repository';
import { BookRepository } from 'src/database/repositories/book.repository';
import { Book, BookDocument } from 'src/database/schemas/book.schema';
import { CreateBookInput, UpdateBookInput } from '../dto/book.dto';
import { CheckoutDto } from '../dto/checkout.dto';
import { ExtendDto } from '../dto/extend.dto';
import { BookCheckoutService } from './book-checkout.service';
import { BookExtendService } from './book-extend.service';
import { BookReserveService } from './book-reserve.service';
import { BookReturnService } from './book-return.service';
import { InjectConnection } from '@nestjs/mongoose';

@Injectable()
export class BooksService {
  constructor(
    private readonly bookRepository: BookRepository,

    private readonly authorRepository: AuthorRepository,

    private readonly queryProvider: QueryService,

    private readonly bookCheckoutService: BookCheckoutService,

    private readonly bookReturnService: BookReturnService,

    private readonly bookExtendService: BookExtendService,

    private readonly bookReserveService: BookReserveService,

    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  public async getAllBooks(queryDto: QueryDto) {
    try {
      const res = await this.queryProvider.query<Book, MyEntityMap>({
        query: queryDto,
        model: this.bookRepository.query(),
        relations: ['authors'],
        searchFieldMap: {
          Book: ['ISBN', 'name', 'category', 'authors'],
          Author: ['name', 'email'],
        },
        searchOptions: 'partial',
      });
      return res;
    } catch (error) {
      Logger.error({ msg: 'Error fetching books', error: error.message, stack: error.stack });
      throw error;
    }
  }

  public async getBookById(id: string) {
    const book = await this.bookRepository
      .query()
      .findById(new Types.ObjectId(id))
      .populate(['authors', 'borrowRecord', 'reservationRequest']);
    if (!book) throw new NotFoundException('Book not Found');

    return book;
  }

  async createBook(createBookInput: CreateBookInput, user: IActiveUser) {
    const existingBook = await this.bookRepository.query().findOne({ ISBN: createBookInput.ISBN });
    if (existingBook) throw new BadRequestException('Book already exists with this ISBN number');
    if (!Array.isArray(createBookInput.authorIds) || createBookInput.authorIds.length === 0) {
      throw new BadRequestException('authorsIds must be a non-empty array');
    }

    const authors = await this.authorRepository.query().find({
      _id: { $in: createBookInput.authorIds.map((id) => new Types.ObjectId(id)) },
    });
    if (authors.length !== createBookInput.authorIds.length)
      throw new NotFoundException('One or more authors were not found.');
    const newBook = new Book();
    newBook.name = createBookInput.name;
    newBook.ISBN = createBookInput.ISBN;
    newBook.category = createBookInput.category;
    newBook.version = createBookInput.version;
    newBook.yearOfPublication = createBookInput.yearOfPublication;
    newBook.createdBy = user.sub;
    newBook.authors = authors.map((author) => author._id);
    let savedBook: BookDocument;
    const session = await this.connection.startSession();
    try {
      savedBook = await session.withTransaction(async () => {
        const book = await this.bookRepository.query().insertOne(newBook, { session });
        for (const author of authors) {
          await this.authorRepository
            .query()
            .updateOne({ _id: author._id }, { $push: { books: book._id } }, { session });
        }
        return book;
      });
    } finally {
      await session.endSession();
    }
    const populatedBook = await this.bookRepository.query().findById(savedBook._id).populate('authors');
    if (!populatedBook) {
      throw new NotFoundException('Saved book not found after creation');
    }
    return populatedBook;

  }


  public async updateBook(id: string, user: IActiveUser, updateBookInput: UpdateBookInput) {
    const existingBook = await this.bookRepository.query().findById(id);

    if (!existingBook) throw new NotFoundException('Book does not exist with this Id');

    const newAuthors = await this.authorRepository.query().find({
      id: { $in: updateBookInput.authorIds?.map((id) => new Types.ObjectId(id)) },
    });

    if (newAuthors.length !== updateBookInput.authorIds?.length)
      throw new NotFoundException('One or more authors were not found.');

    existingBook.name = updateBookInput.name ?? existingBook.name;
    existingBook.yearOfPublication = updateBookInput.yearOfPublication ?? existingBook.yearOfPublication;
    existingBook.category = updateBookInput.category ?? existingBook.category;
    existingBook.version = updateBookInput.version ?? existingBook.version;
    existingBook.updatedBy = user.sub;
    const newAuthorsId = newAuthors.map((author) => author._id);
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        if (updateBookInput.authorIds) {
          if (existingBook.authors) {
            for (const author of existingBook.authors as Types.ObjectId[]) {
              if (!newAuthorsId.includes(author)) {
                await this.authorRepository
                  .query()
                  .updateOne({ _id: author }, { $pull: { books: existingBook._id } }, { session });
              }
            }
            for (const authorId of newAuthorsId) {
              if (!(existingBook.authors as Types.ObjectId[]).includes(authorId)) {
                await this.authorRepository
                  .query()
                  .updateOne({ _id: authorId }, { $push: { books: existingBook._id } }, { session });
              }
            }
          } else {
            for (const authorId of newAuthorsId) {
              await this.authorRepository
                .query()
                .updateOne({ _id: authorId }, { $push: { books: existingBook._id } }, { session });
            }
          }
          existingBook.authors = newAuthors.map((author) => author._id);
          await existingBook.save({ session });
        } else {
          await existingBook.save({ session });
        }
      });
    } finally {
      await session.endSession();
    }
    const updatedBook = await this.bookRepository.query().findById(existingBook._id).populate('authors');
    if (!updatedBook) {
      throw new NotFoundException('Saved book not found after creation');
    }
    return updatedBook;
  }

  public async deleteBook(id: string, user: IActiveUser) {
    const bookToDelete = await this.bookRepository.query().findById(id);

    if (!bookToDelete) throw new NotFoundException('Book does not exist with this Id');

    await this.bookRepository.softDeleteById(id, user.sub);

    return { message: 'Book deleted successfully' };
  }

  public async bookCheckout(id: string, user: IActiveUser, checkoutDto: CheckoutDto) {
    return await this.bookCheckoutService.checkout(id, user, checkoutDto);
  }

  public async bookReturn(id: string, user: IActiveUser) {
    return await this.bookReturnService.bookReturn(id, user);
  }

  public async extendBook(id: string, user: IActiveUser, extendDto: ExtendDto) {
    return await this.bookExtendService.extendBook(id, user, extendDto);
  }

  public async createReservation(id: string, user: IActiveUser) {
    return this.bookReserveService.createReservation(id, user);
  }
}