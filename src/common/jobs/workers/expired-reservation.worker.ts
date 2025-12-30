import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Job } from 'bullmq';
import { Connection } from 'mongoose';

import { ReservationRequestRepository } from 'src/database/repositories/reservation-request.repository';
import { BookDocument } from 'src/database/schemas/book.schema';
import { RequestStatus } from 'src/database/schemas/enums/request-status.enum';
import { ReservationRequestService } from 'src/library/services/reservation-request.service';

@Processor('expired-reservations')
export class ExpiredReservationWorker extends WorkerHost {
  constructor(
    private readonly reservationRequestRepository: ReservationRequestRepository,
    private readonly reservationRequestService: ReservationRequestService,
    @InjectConnection()
    private readonly connection: Connection
  ) {
    super();
  }

  async process(job: Job) {
    Logger.log('Processing job: ' + job.name);
    const now = new Date();
    const expiredReservations = await this.reservationRequestRepository
      .query()
      .find({
        active_until: { $lt: now },
        requestStatus: RequestStatus.APPROVED,
      })
      .populate(['book', 'user'])
      .exec();
    for (const reservation of expiredReservations) {
      const book = reservation.book;
      const user = reservation.user;
      if (!book) continue;
      if (!user) continue;
      Logger.log(`Active period expired for reservation ${reservation.id}, checking next reservation...`);

      reservation.requestStatus = RequestStatus.EXPIRE;
      const session = await this.connection.startSession();
      try {
        await session.withTransaction(async () => {
          await this.reservationRequestService.nextReservation(book as BookDocument, session);
        });
      } finally {
        await session.endSession();
      }
    }
  }
}
