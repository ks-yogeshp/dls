import { Args, Query, Resolver } from "@nestjs/graphql";
import { BorrowRecordDtoDemo } from "./dto/borrow-record.dto";
import { BorrowRecordService } from "./services/borrow-record.service";
import { Auth } from "src/auth/decorators/auth.decorator";
import { Role } from "src/database/schemas/enums/role.enum";
import type { IActiveUser } from "src/auth/interfaces/active-user.interface";
import { ActiveUser } from "src/auth/decorators/active-user.decorator";
import { UserDtoWithPenaltyDemo } from "./dto/user.dto";
import { PenaltySummaryDto } from "./dto/penalty-Summary.dto";
import { IUserWithPenalty } from "src/database/schemas/user.schema";
import { Res } from "@nestjs/common";
import type { Response } from "express";
import { BookActivitySummaryDto } from "./dto/book-activity-summary.dto";
import { IBookWihtBorrowCount } from "src/database/schemas/book.schema";
import { BookDtoWithBorrowCountDemo } from "./dto/book.dto";

@Resolver(BorrowRecordDtoDemo)
export class BorrowRecordResolver {
  constructor(private readonly borrowRecordService: BorrowRecordService) {}

  @Auth({
    roles: [Role.ADMIN, Role.MANAGER],
  })
  @Query(() => [BorrowRecordDtoDemo])
  public async getAllUsers(@ActiveUser() user: IActiveUser) {
    const borrowRecords = await this.borrowRecordService.getBorrowRecord();
    return borrowRecords.map((borrowRecord) => new BorrowRecordDtoDemo(borrowRecord, user.role));
  }

  @Auth({
    roles: [Role.ADMIN, Role.MANAGER],
  })
  @Query(() => [UserDtoWithPenaltyDemo])
  public async penaltiesSummary(@Args('penaltySummary') penaltySummaryDto: PenaltySummaryDto) {
    const penalties: IUserWithPenalty[] =
      await this.borrowRecordService.getPenatliesSummary(penaltySummaryDto);
    return penalties.map((penalty) => new UserDtoWithPenaltyDemo(penalty));
  }

  @Auth({
    roles: [Role.ADMIN, Role.MANAGER],
  })
  @Query(() => String, {
    name: 'exportPenaltiesCSV',
    description: 'Export penalties summary as CSV',
  })
  public async exportPenaltiesCSV(@Res() res: Response, @Args('penaltySummary') penaltySummaryDto: PenaltySummaryDto) {
    const csv = await this.borrowRecordService.exportPenaltiesCSV(penaltySummaryDto);

    res.header('Content-Type', 'text/csv');
    res.attachment('penalties_summary.csv');
    res.send(csv);
  }

  @Auth({
    roles: [Role.ADMIN, Role.MANAGER],
  })
  @Query(() => [BorrowRecordDtoDemo])
  async getBookActivity(@Args('bookActivitySummary') query: BookActivitySummaryDto) {
    const books: IBookWihtBorrowCount[] = await this.borrowRecordService.getBookActivitySummary(query);
    return books.map((book) => new BookDtoWithBorrowCountDemo(book));
  }
}
