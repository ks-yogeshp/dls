import { Injectable } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';

import { FilterOperatorValueDto } from '../dtos/filter-operator-value.dto';

@Injectable()
export class QueryFilterService {
  // private parseValue(value: any): any {
  //   if (typeof value !== 'string') return value;

  //   if (value === 'true') return true;
  //   if (value === 'false') return false;

  //   const num = parseInt(value);
  //   if (!isNaN(num) && isFinite(num)) return num;

  //   if (Array.isArray(value)) {
  //     return value.map((v) => this.parseValue(v));
  //   }
  //   return value;
  // }
  // private operatorMap<V>(key: string, value: any): FindOperator<V> | V | undefined {
  //   const search = this.parseValue(value);
  //   switch (key) {
  //     case 'eq':
  //       return search as V;
  //     // case 'neq':
  //     //   return Not(search) as FindOperator<V>;
  //     case 'gt':
  //       return MoreThan(search) as FindOperator<V>;
  //     case 'gte':
  //       return MoreThanOrEqual(search) as FindOperator<V>;
  //     case 'lt':
  //       return LessThan(search) as FindOperator<V>;
  //     case 'lte':
  //       return LessThanOrEqual(search) as FindOperator<V>;
  //     case 'like':
  //       return Like(`%${search}%`) as FindOperator<V>; // Note: 'like' is often case-sensitive
  //     case 'ilike':
  //       return ILike(`%${search}%`) as FindOperator<V>;
  //     case 'isNull':
  //       return search === true ? IsNull() : (Not(IsNull()) as FindOperator<V>);
  //     case 'in':
  //       return In(Array.isArray(search) ? search : [...search.split(',')]) as FindOperator<V>;
  //     case 'any':
  //       return Any(Array.isArray(search) ? search : [...search.split(',')]) as FindOperator<V>;
  //     case 'between':
  //       if (Array.isArray(search) && search.length === 2) {
  //         return Between(search[0], search[1]) as FindOperator<V>;
  //       }
  //       throw new Error(
  //         `Invalid value for 'between' operator. Expected an array of two elements, got: ${JSON.stringify(search)}`
  //       );
  //     // case 'nin':
  //     //   return Not(In(Array.isArray(search) ? search : [search])) as FindOperator<V>;

  //     default:
  //       return undefined;
  //   }
  // }

  // public filterWhere = <T extends ObjectLiteral>(
  //   repo: Repository<T>,
  //   filters: Record<string, FilterOperatorValueDto>
  // ): FindOptionsWhere<T> => {
  //   const result: FindOptionsWhere<T> = {};

  //   for (const key in filters) {
  //     if (Object.prototype.hasOwnProperty.call(filters, key)) {
  //       const column = repo.metadata.columns.find((c) => c.propertyName === key);
  //       if (!column) {
  //         continue;
  //       }
  //       const filterValue = filters[key];
  //       const operator = Object.keys(filterValue)[0];
  //       const value = filterValue[operator];
  //       type ColumnType = T[typeof key];
  //       const typeOrmOperator = this.operatorMap<ColumnType>(operator, value);

  //       if (typeOrmOperator !== undefined) {
  //         if (column.enum && column.isArray) {
  //           // result[key as keyof T] = Raw(
  //           //   (alias) => `${alias} ::text ILIKE :search`,
  //           //   { search: `%${value}%` },
  //           // ) as any;
  //           // result[key as keyof T] = typeOrmOperator as any;
  //           result[key as keyof T] = Raw(
  //             (alias) => `${alias} && :values`, // array overlap operator
  //             { values: Array.isArray(value) ? value : [...value.split(',')] }
  //           ) as any;
  //         } else {
  //           result[key as keyof T] = typeOrmOperator as any;
  //         }
  //       }
  //     }
  //   }

  //   return result;
  // };

  // public singleWhere = <T extends ObjectLiteral, V>(
  //   filter: FilterOperatorValueDto,
  //   key: string,
  //   repo: Repository<T>
  // ): FindOperator<V> | V | undefined => {
  //   const [[operator, value]] = Object.entries(filter);
  //   const column = repo.metadata.columns.find((c) => c.propertyName === key);
  //   if (!column) {
  //     return;
  //   }
  //   if (column.enum && column.isArray) {
  //     // return Raw((alias) => `${alias} ::text ILIKE :search`, {
  //     //   search: `%${value}%`,
  //     // });
  //     return Raw(
  //       (alias) => `${alias} && :values`, // array overlap operator
  //       { values: Array.isArray(value) ? value : [...value.split(',')] }
  //     ) as any;
  //   } else {
  //     return this.operatorMap<V>(operator, value);
  //   }
  // };

  /**
   * Converts string/array values to proper types (number, boolean, array).
   */
  private parseValue(value: any): any {
    if (typeof value !== 'string') return value;

    if (value === 'true') return true;
    if (value === 'false') return false;

    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num)) return num;

    if (Array.isArray(value)) return value.map((v) => this.parseValue(v));

    return value;
  }

  /**
   * Maps a filter operator to a Mongoose query condition.
   */
  private operatorMap(key: string, value: any) {
    const v = this.parseValue(value);
    switch (key) {
      case 'eq':
        return v;
      case 'neq':
        return { $ne: v };
      case 'gt':
        return { $gt: v };
      case 'gte':
        return { $gte: v };
      case 'lt':
        return { $lt: v };
      case 'lte':
        return { $lte: v };
      case 'like': // case-insensitive regex match
        return { $regex: new RegExp(this.escapeRegex(v), 'i') };
      case 'ilike':
        return { $regex: new RegExp(this.escapeRegex(v), 'i') };
      case 'in':
        return { $in: Array.isArray(v) ? v : v.toString().split(',') };
      case 'nin':
        return { $nin: Array.isArray(v) ? v : v.toString().split(',') };
      case 'between':
        if (Array.isArray(v) && v.length === 2) return { $gte: v[0], $lte: v[1] };
        throw new Error(`Invalid value for 'between': ${JSON.stringify(v)}`);
      case 'isNull':
        return v === true ? null : { $ne: null };
      default:
        return v;
    }
  }

  /**
   * Builds a full Mongoose filter query from a filters object.
   * Example filter:
   * {
   *   name: { like: 'John' },
   *   age: { gte: 18 },
   *   tags: { in: ['student','admin'] }
   * }
   */
  public buildFilter = <T>(
    model: Model<T>,
    filters: Record<string, FilterOperatorValueDto>
  ): FilterQuery<T> => {
    const query: FilterQuery<T> = {};
    const schemaPaths = model.schema.paths;
    for (const key in filters) {
      const path = schemaPaths[key];
      if (!path) continue;
      if (!Object.prototype.hasOwnProperty.call(filters, key)) continue;

      const filter = filters[key];
      const operator = Object.keys(filter)[0];
      const value = filter[operator];

      const condition = this.operatorMap(operator, value);

      query[key as keyof T] = condition;
    }
    return query;
  };

  /**
   * Escape regex special characters to safely use in $regex.
   */
  private escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
