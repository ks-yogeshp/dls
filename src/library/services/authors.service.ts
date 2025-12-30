import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { MyEntityMap } from 'src/app.types';
import { IActiveUser } from 'src/auth/interfaces/active-user.interface';
import { QueryDto } from 'src/common/dtos/query.dto';
import { QueryService } from 'src/common/query/query.service';
import { AuthorRepository } from 'src/database/repositories/author.repository';
import { Author } from 'src/database/schemas/author.schema';
import { CreateAuthorInput, UpdateAuthorInput } from '../dto/author.dto';

@Injectable()
export class AuthorsService {
  constructor(
    private readonly authorRepository: AuthorRepository,

    private readonly queryProvider: QueryService
  ) {}

  public async getAllAuthors(queryDto: QueryDto) {
    try {
      return this.queryProvider.query<Author, MyEntityMap>({
        query: queryDto,
        model: this.authorRepository.query(),
        searchFieldMap: {
          Author: ['name', 'email', 'country'],
        },
      });
    } catch (error) {
      Logger.error({ msg: 'Error fetching authors', error: error.message, stack: error.stack });
      throw error;
    }
  }

  public async getAuthorById(id: string) {
    const author = await this.authorRepository.query().findById(new Types.ObjectId(id));
    if (!author) throw new NotFoundException('author not Found');

    return author;
  }

  public async createAuthor(user: IActiveUser, createAuthorInput: CreateAuthorInput) {
    const existingAuthor = await this.authorRepository.query().findOne({ email: createAuthorInput.email });

    if (existingAuthor) throw new BadRequestException('Author already exists with this email');

    const newAuthor = new Author();
    newAuthor.name = createAuthorInput.name;
    newAuthor.email = createAuthorInput.email;
    newAuthor.country = createAuthorInput.country;
    newAuthor.createdBy = user.sub;

    return await this.authorRepository.query().insertOne(newAuthor);
  }

  public async updateAuthor(id: string, user: IActiveUser, updateAuthorInput: UpdateAuthorInput) {
    const existingAuthor = await this.authorRepository.query().findById(new Types.ObjectId(id));

    if (!existingAuthor) throw new NotFoundException('Author does not exist with this Id');

    existingAuthor.name = updateAuthorInput.name ?? existingAuthor.name;
    existingAuthor.country = updateAuthorInput.country ?? existingAuthor.country;
    existingAuthor.updatedBy = user.sub;
    await existingAuthor.save();

    return existingAuthor;
  }

  public async deleteAuthor(id: string, user: IActiveUser) {
    const authorToDelete = await this.authorRepository.query().findById(new Types.ObjectId(id));
    if (!authorToDelete) throw new NotFoundException('Author does not exist with this Id');
    await this.authorRepository.softDeleteById(id, user.sub);

    return { message: 'Author deleted successfully' };
  }
}
