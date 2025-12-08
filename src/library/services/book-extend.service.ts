import { BadRequestException, Injectable } from '@nestjs/common';
import { add, differenceInCalendarDays, startOfDay } from 'date-fns';
import { Types } from 'mongoose';

import { IActiveUser } from 'src/auth/interfaces/active-user.interface';
import { BorrowRecordRepository } from 'src/database/repositories/borrow-record.repository';
import { BookStatus } from 'src/database/schemas/enums/book-status.enum';
import { ExtendDto } from '../dto/extend.dto';

@Injectable()
export class BookExtendService {
  constructor(private readonly borrowRecordRepository: BorrowRecordRepository) {}

  public async extendBook(id: string, user: IActiveUser, extendDto: ExtendDto) {
    const record = await this.borrowRecordRepository
      .query()
      .findOne({
        book: new Types.ObjectId(id),
        user: new Types.ObjectId(user.sub),
        bookStatus: BookStatus.BORROWED,
      })
      .populate(['book', 'user'])
      .exec();
    if (!record) {
      throw new BadRequestException('No borrow record found for this user and book');
    }
    const now = startOfDay(new Date());
    const dueDate = startOfDay(record.dueDate);
    const overdueDays = differenceInCalendarDays(now, dueDate);
    if (overdueDays <= -2 && record.extensionCount < 3) {
      record.extensionCount++;
      record.dueDate = add(dueDate, { days: extendDto.days });
      return await record.save();
    } else {
      throw new BadRequestException(
        'Extension not allowed (too close to due date or max extensions reached)'
      );
    }
  }
}
