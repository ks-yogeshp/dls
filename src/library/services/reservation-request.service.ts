import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Queue } from 'bullmq';
import { add, addDays, startOfDay } from 'date-fns';
import { ClientSession, Connection, Types } from 'mongoose';

import { BookRepository } from 'src/database/repositories/book.repository';
import { BorrowRecordRepository } from 'src/database/repositories/borrow-record.repository';
import { ReservationRequestRepository } from 'src/database/repositories/reservation-request.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { BookDocument } from 'src/database/schemas/book.schema';
import { BorrowRecord, BorrowRecordDocument } from 'src/database/schemas/borrow-record.schema';
import { AvailabilityStatus } from 'src/database/schemas/enums/availibity-status.enum';
import { ReservationRequestDocument } from 'src/database/schemas/reservation-request.schema';
import { RequestStatus } from '../../database/schemas/enums/request-status.enum';
import { CheckoutReservationRequestDto } from '../dto/checkout-reservation-request.dto';

@Injectable()
export class ReservationRequestService {
  constructor(
    private readonly reservationRequestRepository: ReservationRequestRepository,

    private readonly borrowRecordRepository: BorrowRecordRepository,

    private readonly bookRepository: BookRepository,

    private readonly userRepository: UserRepository,

    @InjectQueue('mail-queue') private mailQueue: Queue,

    @InjectConnection()
    private readonly connection: Connection
  ) {}

  public async get() {
    return await this.reservationRequestRepository.query().find();
  }

  public async nextReservation(book: BookDocument, session: ClientSession) {
    const nextReservation = await this.reservationRequestRepository
      .query()
      .findOne({
        bookId: book._id,
        requestStatus: RequestStatus.PENDING,
      })
      .sort({ requestDate: 1 })
      .populate('user', 'book')
      .exec();
    if (nextReservation) {
      const activeUntil = addDays(new Date(), 1);

      nextReservation.requestStatus = RequestStatus.APPROVED;
      nextReservation.active_until = activeUntil;
      await this.mailQueue.add(
        'mail-queue',
        {
          name: 'reservation-approve',
          data: {
            id: nextReservation.id,
          },
        },
        {
          removeOnComplete: true,
          removeOnFail: true,
        }
      );
      await nextReservation.save({ session });
    } else {
      book.availabilityStatus = AvailabilityStatus.AVAILABLE;
      await book.save({ session });
    }
  }

  public async checkoutBook(id: string, checkoutReservationRequestDto: CheckoutReservationRequestDto) {
    const now = new Date();
    const reservation = await this.reservationRequestRepository
      .query()
      .findOne({
        _id: new Types.ObjectId(id),
        requestStatus: RequestStatus.APPROVED,
        active_until: { $gt: now },
      })
      .populate(['user', 'book'])
      .exec();
    if (!reservation) {
      throw new BadRequestException('Reservation not found');
    }

    const newRecord = new BorrowRecord();
    newRecord.book = reservation.book;
    newRecord.user = reservation.user;
    newRecord.borrowDate = startOfDay(now);
    newRecord.dueDate = add(now, { days: checkoutReservationRequestDto.days });
    const session = await this.connection.startSession();
    let saved: BorrowRecordDocument;
    try {
      saved = await session.withTransaction(async () => {
        reservation.requestStatus = RequestStatus.FULFILLED;
        await reservation.save({ session });
        const createdRecord = await this.borrowRecordRepository.query().insertOne(newRecord, { session });
        await this.bookRepository
          .query()
          .updateOne(
            { _id: reservation.book._id },
            { $push: { borrowRecord: createdRecord._id } },
            { session }
          );
        await this.userRepository
          .query()
          .updateOne(
            { _id: reservation.user._id },
            { $push: { borrowRecord: createdRecord._id } },
            { session }
          );
        return createdRecord;
      });
    } finally {
      await session.endSession();
    }
    const populatedRecord = await this.borrowRecordRepository
      .query()
      .findById(saved._id)
      .populate('book')
      .populate('user');
    if (!populatedRecord) {
      throw new BadRequestException('Error populating borrow record after creation.');
    }
    return populatedRecord;
  }

  public async cancelResrvation(id: string) {
    const reservation = await this.reservationRequestRepository
      .query()
      .findOne({
        _id: new Types.ObjectId(id),
        requestStatus: { $in: [RequestStatus.APPROVED, RequestStatus.PENDING] },
      })
      .populate(['user', 'book'])
      .exec();
    if (!reservation) {
      throw new BadRequestException();
    }
    let updatedReservation: ReservationRequestDocument;
    const session = await this.connection.startSession();
    try {
      updatedReservation = await session.withTransaction(async () => {
        if (reservation.requestStatus === RequestStatus.APPROVED) {
          await this.nextReservation(reservation.book as BookDocument, session);
        }
        reservation.requestStatus = RequestStatus.CANCELLED;
        return await reservation.save({ session });
      });
    } finally {
      await session.endSession();
    }

    return updatedReservation;
  }
}
