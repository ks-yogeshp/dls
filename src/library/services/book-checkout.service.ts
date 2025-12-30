import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { add, startOfDay } from 'date-fns';
import { Connection, Types } from 'mongoose';

import { IActiveUser } from 'src/auth/interfaces/active-user.interface';
import { BookRepository } from 'src/database/repositories/book.repository';
import { BorrowRecordRepository } from 'src/database/repositories/borrow-record.repository';
import { UserRepository } from 'src/database/repositories/user.repository';
import { BorrowRecord, BorrowRecordDocument } from 'src/database/schemas/borrow-record.schema';
import { AvailabilityStatus } from '../../database/schemas/enums/availibity-status.enum';
import { CheckoutDto } from '../dto/checkout.dto';

@Injectable()
export class BookCheckoutService {
  constructor(
    private readonly bookRepository: BookRepository,

    private readonly userRepository: UserRepository,

    private readonly borrowRecordRepository: BorrowRecordRepository,

    @InjectConnection()
    private readonly connection: Connection
  ) {}

  public async checkout(
    id: string,
    user: IActiveUser,
    checkoutDto: CheckoutDto
  ): Promise<BorrowRecordDocument> {
    const bookDetail = await this.bookRepository.query().findById(new Types.ObjectId(id));
    const userDetail = await this.userRepository.query().findById(user.sub);
    if (!bookDetail || !userDetail) {
      throw new BadRequestException('Invalid book or user. Please check the IDs.');
    }

    if (bookDetail.availabilityStatus === AvailabilityStatus.UNAVAILABLE) {
      throw new BadRequestException(`The book "${bookDetail.name}" is currently unavailable for borrowing.`);
    }

    const now = startOfDay(new Date());

    const newRecord = new BorrowRecord();
    newRecord.book = bookDetail._id;
    newRecord.user = userDetail._id;
    newRecord.borrowDate = now;
    newRecord.dueDate = add(now, { days: checkoutDto.days });
    let insertedDoc: BorrowRecordDocument;
    const session = await this.connection.startSession();
    try {
      insertedDoc = await session.withTransaction(async () => {
        const createdRecord = await this.borrowRecordRepository.query().insertOne(newRecord, { session });
        await this.bookRepository
          .query()
          .updateOne(
            { _id: bookDetail._id },
            {
              $set: { availabilityStatus: AvailabilityStatus.UNAVAILABLE },
              $push: { borrowRecord: createdRecord._id },
            },
            { session }
          );
        await this.userRepository
          .query()
          .updateOne({ _id: userDetail._id }, { $push: { borrowRecord: createdRecord._id } }, { session });
        return createdRecord;
      });
    } finally {
      await session.endSession();
    }
    const populatedRecord = await this.borrowRecordRepository
      .query()
      .findById(insertedDoc._id)
      .populate('book')
      .populate('user');
    if (!populatedRecord) {
      throw new BadRequestException('Error populating borrow record after creation.');
    }
    return populatedRecord;
  }
}
