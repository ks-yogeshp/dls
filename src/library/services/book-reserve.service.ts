import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';

import { IActiveUser } from 'src/auth/interfaces/active-user.interface';
import { BookRepository } from 'src/database/repositories/book.repository';
import { BorrowRecordRepository } from 'src/database/repositories/borrow-record.repository';
import { ReservationRequestRepository } from 'src/database/repositories/reservation-request.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { AvailabilityStatus } from 'src/database/schemas/enums/availibity-status.enum';
import { BookStatus } from 'src/database/schemas/enums/book-status.enum';
import { RequestStatus } from 'src/database/schemas/enums/request-status.enum';
import {
  ReservationRequest,
  ReservationRequestDocument,
} from 'src/database/schemas/reservation-request.schema';

@Injectable()
export class BookReserveService {
  constructor(
    private readonly borrowRepository: BorrowRecordRepository,
    private readonly reservationRepository: ReservationRequestRepository,
    private readonly bookRepository: BookRepository,
    private readonly userRepository: UserRepository,
    @InjectConnection()
    private readonly connection: Connection
  ) {}

  public async createReservation(id: string, user: IActiveUser) {
    const request = await this.reservationRepository.query().findOne({
      book: new Types.ObjectId(id),
      user: new Types.ObjectId(user.sub),
      requestStatus: { $in: [RequestStatus.APPROVED, RequestStatus.PENDING] },
    });

    if (request) {
      throw new BadRequestException('Reservation request already exists for this book and user');
    }
    const bookDetail = await this.bookRepository.query().findById(id);
    const userDetail = await this.userRepository.query().findById(user.sub);
    if (!bookDetail || !userDetail)
      throw new BadRequestException('Invalid book or user. Please check the IDs.');

    if (bookDetail.availabilityStatus === AvailabilityStatus.AVAILABLE) {
      throw new BadRequestException(`The book "${bookDetail.name}" is currently available for borrowing.`);
    }

    const borrowRecord = await this.borrowRepository.query().findOne({
      book: new Types.ObjectId(id),
      user: new Types.ObjectId(user.sub),
      bookStatus: { $in: [BookStatus.BORROWED, BookStatus.OVERDUE] },
    });
    if (borrowRecord) throw new BadRequestException('You cannot reserve a book you have already borrowed.');

    const newRequst = new ReservationRequest();
    newRequst.book = bookDetail._id;
    newRequst.user = userDetail._id;
    const session = await this.connection.startSession();
    let insertedDoc: ReservationRequestDocument;
    try {
      insertedDoc = await session.withTransaction(async () => {
        const createdReq = await this.reservationRepository.query().insertOne(newRequst, { session });
        await this.bookRepository
          .query()
          .updateOne({ _id: bookDetail._id }, { $push: { reservationRequest: createdReq._id } }, { session });
        await this.userRepository
          .query()
          .updateOne({ _id: userDetail._id }, { $push: { reservationRequest: createdReq._id } }, { session });
        return createdReq;
      });
    } finally {
      await session.endSession();
    }
    const populatedRequest = await this.reservationRepository
      .query()
      .findById(insertedDoc._id)
      .populate('book')
      .populate('user');
    if (!populatedRequest) {
      throw new BadRequestException('Error populating borrow record after creation.');
    }
    return populatedRequest;
  }
}
