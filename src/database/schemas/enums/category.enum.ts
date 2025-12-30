import { registerEnumType } from '@nestjs/graphql';

export enum Category {
  FICTION = 'fiction',
  NON_FICTION = 'non_fiction',
  SCIENCE = 'science',
  TECHNOLOGY = 'technology',
  HISTORY = 'history',
  BIOGRAPHY = 'biography',
  ART = 'art',
  CHILDREN = 'children',
  EDUCATION = 'education',
  MYSTERY = 'mystery',
  ROMANCE = 'romance',
  FANTASY = 'fantasy',
  SELF_HELP = 'self_help',
  RELIGION = 'religion',
  POETRY = 'poetry',
  BUSINESS = 'business',
  TRAVEL = 'travel',
  OTHER = 'other',
}
registerEnumType(Category, {
  name: 'Category', // This will be the name in GraphQL schema
  description: 'Category or genre of the book',
});
