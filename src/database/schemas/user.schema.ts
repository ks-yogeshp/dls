import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { SoftDeletePlugin } from '../plugins/soft-delete.plugin';
import { AbstractSoftSchema } from './abstract-soft.schema';
import { BorrowRecordDocument } from './borrow-record.schema';
import { Role } from './enums/role.enum';
import { ReservationRequestDocument } from './reservation-request.schema';

export type UserDocument = HydratedDocument<User>;
export type IUserWithPenalty = UserDocument & { totalPenalty: number };
@Schema()
export class User extends AbstractSoftSchema {
  @Prop({
    type: String,
    required: true,
  })
  firstName: string;

  @Prop({
    type: String,
    required: false,
  })
  lastName?: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  email: string;

  @Prop({
    type: String,
    required: false,
  })
  password?: string;

  @Prop({
    type: String,
    enum: Role,
    default: Role.STUDENT,
  })
  role?: Role;

  @Prop({
    type: String,
    required: false,
  })
  googleId?: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'BorrowRecord' }],
    required: false,
  })
  borrowRecord?: (Types.ObjectId | BorrowRecordDocument)[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'ReservationRequest' }],
    required: false,
  })
  reservationRequest?: (Types.ObjectId | ReservationRequestDocument)[];
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.plugin(SoftDeletePlugin);
