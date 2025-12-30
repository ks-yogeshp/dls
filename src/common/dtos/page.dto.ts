import { ApiProperty } from '@nestjs/swagger';

import { PageLinksDto } from './page-links.dto';
import { PageMetaDto } from './page-meta.dto';
import { Field, ObjectType } from '@nestjs/graphql';
import { Type } from '@nestjs/common';

export class PageDto<T> {

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  readonly data: T[];

  @ApiProperty({ type: () => PageMetaDto })
  readonly meta: PageMetaDto;

  @ApiProperty({ type: () => PageLinksDto })
  readonly links: PageLinksDto;

  constructor(data: T[], page: number, limit: number, count: number, url: URL) {
    this.data = data;
    this.meta = new PageMetaDto(page, limit, count);
    this.links = new PageLinksDto(url, this.meta.totalPages, this.meta.currentPage);
  }
}

export function Paginated<T>(classRef: Type<T>): Type<any> {
  @ObjectType({ isAbstract: true })
  class PaginatedType {
    @Field(() => [classRef])
    @ApiProperty({ type: [classRef] })
    data: T[];

    @Field(() => PageMetaDto, { nullable: true })
    @ApiProperty({ type: () => PageMetaDto, required: false })
    meta?: PageMetaDto;

    // @Field(() => PageLinksDto, { nullable: true })
    // @ApiProperty({ type: () => PageLinksDto, required: false })
    // links?: PageLinksDto;

    constructor(
      data?: T[],
      page?: number,
      limit?: number,
      count?: number,
      // url?: URL,
    ) {
      this.data = data || [];
      if (page !== undefined && limit !== undefined && count !== undefined) {
        this.meta = new PageMetaDto(page, limit, count);
      }
      // if (url && this.meta) {
      //   this.links = new PageLinksDto(url, this.meta.totalPages, this.meta.currentPage);
      // }
    }
  }
  return PaginatedType;
}
