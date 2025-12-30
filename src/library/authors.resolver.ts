// import { Body, Controller, Param, Query } from '@nestjs/common';

import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import type { IActiveUser } from 'src/auth/interfaces/active-user.interface';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { QueryDto } from 'src/common/dtos/query.dto';
import { QueryDtoPipe } from 'src/common/query/pipes/queryDtoPipe';
import { Author } from 'src/database/schemas/author.schema';
import { AuthorDtoDemo, CreateAuthorInput, DetailedAuthorDtoDemo, PaginatedAuthors, UpdateAuthorInput } from './dto/author.dto';
import { AuthorsService } from './services/authors.service';
import { Role } from 'src/database/schemas/enums/role.enum';
import { SuccessDto } from './dto/success.dto';

@Resolver(() => AuthorDtoDemo)
export class AuthorsResolver {
  constructor(private readonly authorsService: AuthorsService) {}

  @Auth()
  @Query(() => [AuthorDtoDemo])
  public async getAllAuthors(
    @ActiveUser() user: IActiveUser,
    @Args('query', { nullable: true }, new QueryDtoPipe(Author)) queryDto: QueryDto
  ) {
    const authors = await this.authorsService.getAllAuthors(queryDto);
    const result = authors.result.map((author) => new AuthorDtoDemo(author));
    return new PaginatedAuthors(result, queryDto.page, queryDto.limit, authors.totalItems, authors.newUrl)
  }

  @Auth()
  @Query(() => DetailedAuthorDtoDemo)
  public async getAuthorById(@Args('id') id: string, @ActiveUser() user: IActiveUser) {
    const author = await this.authorsService.getAuthorById(id);
    return new DetailedAuthorDtoDemo(author, user.role);
  }

  @Auth({ roles: [Role.ADMIN, Role.MANAGER] })
  @Mutation(() => DetailedAuthorDtoDemo)
  public async createAuthor(@ActiveUser() user: IActiveUser, @Args('createAuthorInput') createAuthorInput: CreateAuthorInput) {
    const author = await this.authorsService.createAuthor(user, createAuthorInput);
    return new DetailedAuthorDtoDemo(author, user.role);
  }

  @Auth({ roles: [Role.ADMIN, Role.MANAGER] })
  @Mutation(() => DetailedAuthorDtoDemo)
  public async updateAuthor(
    @Args('id') id: string,
    @ActiveUser() user: IActiveUser,
    @Args('updateAuthorInput') updateAuthorInput: UpdateAuthorInput
  ) {
    const author = await this.authorsService.updateAuthor(id, user, updateAuthorInput);
    return new DetailedAuthorDtoDemo(author, user.role);
  }

  @Auth({ roles: [Role.ADMIN] })
  @Mutation(() => SuccessDto)
  public async deleteAuthor(@Args('id') id: string, @ActiveUser() user: IActiveUser) {
    await this.authorsService.deleteAuthor(id, user);
    return new SuccessDto();
  }
}
