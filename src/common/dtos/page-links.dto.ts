import { Field, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType()
export class PageLinksDto {

  @Field()
  @ApiProperty({
    example: 'http://example.com/api/items?page=1',
    description: 'Link to the first page of results',
  })
  readonly first: string;

  @Field()
  @ApiProperty({
    example: 'http://example.com/api/items?page=10',
    description: 'Link to the last page of results',
  })
  readonly last: string;

  @Field()
  @ApiProperty({
    example: 'http://example.com/api/items?page=3',
    description: 'Link to the current page of results',
  })
  readonly current: string;

  @Field()
  @ApiProperty({
    example: 'http://example.com/api/items?page=4',
    description: 'Link to the next page of results',
  })
  readonly next: string;

  @Field()
  @ApiProperty({
    example: 'http://example.com/api/items?page=2',
    description: 'Link to the previous page of results',
  })
  readonly previous: string;

  constructor(url: URL, totalPages: number, currentPage: number) {
    const buildPageLink = (page: number) => {
      const params = new URLSearchParams(url.search);
      params.set('page', page.toString());
      return `${url.origin}${url.pathname}?${params.toString()}`;
    };
    this.first = buildPageLink(1);
    this.last = buildPageLink(totalPages);
    this.current = buildPageLink(currentPage);
    this.next = buildPageLink(Math.min(currentPage + 1, totalPages));
    this.previous = buildPageLink(Math.max(currentPage - 1, 1));
  }
}
