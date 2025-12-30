import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { ReservationRequestDtoDemo } from "./dto/reservation-request.dto";
import { ReservationRequestService } from "./services/reservation-request.service";
import { Auth } from "src/auth/decorators/auth.decorator";
import { Role } from "src/database/schemas/enums/role.enum";
import { BorrowRecordDtoDemo } from "./dto/borrow-record.dto";
import { CheckoutReservationRequestDto } from "./dto/checkout-reservation-request.dto";

@Resolver(ReservationRequestDtoDemo)
export class ReservationRequestResolver {
  constructor(private readonly reservationRequestService: ReservationRequestService) {}

  @Auth({
    roles: [Role.STUDENT],
  })
  @Mutation(() => BorrowRecordDtoDemo)
  public async reserveBook(
    @Args('id') id: string,
    @Args('checkoutReservationRequest') checkoutReservationRequestDto: CheckoutReservationRequestDto
  ) {
    const record = await this.reservationRequestService.checkoutBook(id, checkoutReservationRequestDto);
    return new BorrowRecordDtoDemo(record);
  }

  @Auth({
    roles: [Role.STUDENT],
  })
  @Mutation(() => ReservationRequestDtoDemo)
  public async cancelReservation(@Args('id') id: string) {
    const record = await this.reservationRequestService.cancelResrvation(id);
    return new ReservationRequestDtoDemo(record);
  }
}
