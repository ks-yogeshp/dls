
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { DetailedUserDtoDemo, PaginatedUsers, UpdateUserInput, UserDtoDemo } from "./dto/user.dto";
import { UsersService } from "./services/users.service";
import { Auth } from "src/auth/decorators/auth.decorator";
import { Role } from "src/database/schemas/enums/role.enum";
import { ActiveUser } from "src/auth/decorators/active-user.decorator";
import { QueryDto } from "src/common/dtos/query.dto";
import type { IActiveUser } from "src/auth/interfaces/active-user.interface";
import { SuccessDto } from "./dto/success.dto";


@Resolver(() => UserDtoDemo)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Auth({
    roles: [Role.ADMIN, Role.MANAGER],
  })
  @Query(() => [UserDtoDemo])
  public async getAllUsers(
    @Args('query') queryDto: QueryDto,
    @ActiveUser() activeUser: IActiveUser
  ) {
    const users = await this.usersService.getAllUsers(queryDto);
    const result = users.result.map((user) => new UserDtoDemo(user, activeUser.role));
    return new PaginatedUsers(result, queryDto.page, queryDto.limit, users.totalItems, users.newUrl);
  }

  @Auth({
    roles: [Role.STUDENT],
  })
  @Query(() => DetailedUserDtoDemo)
  public async getUserById(@ActiveUser() activeUser: IActiveUser) {
    const user = await this.usersService.getUserById(activeUser.sub);
    return new DetailedUserDtoDemo(user);
  }

  @Auth()
  @Mutation(() => DetailedUserDtoDemo)
  public async updateUser(@ActiveUser() activeUser: IActiveUser, @Args('updateUserInput') updateUserInput: UpdateUserInput) {
    const user = await this.usersService.updateUser(activeUser.sub, updateUserInput);
    return new DetailedUserDtoDemo(user);
  }

  @Auth()
  @Mutation(() => SuccessDto)
  public deleteUser(@ActiveUser() activeUser: IActiveUser) {
    return this.usersService.deleteUser(activeUser.sub);
  }
}
