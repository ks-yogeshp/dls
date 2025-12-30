import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';

import { IActiveUser } from 'src/auth/interfaces/active-user.interface';
import { BorrowRecordRepository } from 'src/database/repositories/borrow-record.repository';
import { BookDocument } from 'src/database/schemas/book.schema';
import { BorrowRecordDocument } from 'src/database/schemas/borrow-record.schema';
import { BookStatus } from 'src/database/schemas/enums/book-status.enum';
import { ReservationRequestService } from 'src/library/services/reservation-request.service';

@Injectable()
export class BookReturnService {
  constructor(
    private readonly borrowRecordRepository: BorrowRecordRepository,

    private readonly reservationRequestSerivce: ReservationRequestService,

    @InjectConnection()
    private readonly connection: Connection
  ) {}

  public async bookReturn(id: string, user: IActiveUser) {
    const record = await this.borrowRecordRepository
      .query()
      .findOne({
        book: new Types.ObjectId(id),
        user: new Types.ObjectId(user.sub),
        bookStatus: { $in: [BookStatus.BORROWED, BookStatus.OVERDUE] },
      })
      .populate(['book', 'user'])
      .exec();
    if (!record) {
      throw new BadRequestException('No borrow record found for this user and book');
    } else {
      const returnDate = new Date();
      record.returnDate = returnDate;
      record.bookStatus = BookStatus.RETURNED;
      record.penaltyPaid = true;
      let returnDoc: BorrowRecordDocument;
      const session = await this.connection.startSession();
      try {
        returnDoc = await session.withTransaction(async () => {
          await this.reservationRequestSerivce.nextReservation(record.book as BookDocument, session);
          return await record.save({ session });
        });
      } finally {
        await session.endSession();
      }
      return returnDoc;
    }
  }
}
