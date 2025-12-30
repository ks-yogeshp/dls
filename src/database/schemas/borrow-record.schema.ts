import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { AbstractSoftSchema } from './abstract-soft.schema';
import { BookDocument } from './book.schema';
import { BookStatus } from './enums/book-status.enum';
import { UserDocument } from './user.schema';

export type BorrowRecordDocument = HydratedDocument<BorrowRecord>;

@Schema({ timestamps: true })
export class BorrowRecord extends AbstractSoftSchema {
  @Prop({ type: Types.ObjectId, ref: 'Book' })
  book: Types.ObjectId | BookDocument;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user: Types.ObjectId | UserDocument;

  @Prop({
    type: Date,
    required: true,
  })
  borrowDate: Date;

  @Prop({
    type: Date,
    required: true,
  })
  dueDate: Date;

  @Prop({
    type: Date,
    required: false,
  })
  returnDate?: Date;

  @Prop({
    type: Number,
    default: 0,
  })
  penalty?: number;

  @Prop({
    type: Boolean,
    required: false,
  })
  penaltyPaid?: boolean;

  @Prop({
    type: Number,
    required: true,
    default: 0,
  })
  extensionCount: number;

  @Prop({
    type: String,
    enum: BookStatus,
    required: true,
    default: BookStatus.BORROWED,
  })
  bookStatus: BookStatus;
}

export const BorrowRecordSchema = SchemaFactory.createForClass(BorrowRecord);
