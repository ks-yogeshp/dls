import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';

import { SearchOptions } from '../dtos/query.options.dto';

@Injectable()
export class QuerySearchService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  private parseValue(value: any): any {
    if (typeof value !== 'string') return value;

    if (value === 'true') return true;
    if (value === 'false') return false;

    const num = parseInt(value);
    if (!isNaN(num) && isFinite(num)) return num;

    if (Array.isArray(value)) {
      return value.map((v) => this.parseValue(v));
    }
    return value;
  }

  public buildSearch = <T>(
    search: string,
    model: Model<T>,
    searchFieldMap,
    options: SearchOptions = 'partial',
    visitedModels: Set<string> = new Set(),
    parentPath: string = ''
  ): FilterQuery<T> => {
    if (!search) return {};

    const schemaName = model.modelName;

    // Prevent infinite recursion in cyclic schemas
    if (visitedModels.has(schemaName)) return {};
    visitedModels.add(schemaName);

    const fields = searchFieldMap[schemaName];
    if (!fields || fields.length === 0) return {};

    const schemaPaths = model.schema.paths;

    // -----------------------------
    // 1. Build regex or direct value
    // -----------------------------
    const makeValue = () => {
      switch (options) {
        case 'startsWith':
          return { $regex: new RegExp('^' + escapeRegex(search), 'i') };
        case 'endsWith':
          return { $regex: new RegExp(escapeRegex(search) + '$', 'i') };
        case 'exact':
          return search;
        case 'fulltext':
          return { $text: { $search: search } };
        case 'partial':
        default:
          return { $regex: new RegExp(escapeRegex(search), 'i') };
      }
    };

    const matchValue = makeValue();

    // -----------------------------
    // 2. Split fields into:
    //    - direct string fields
    //    - nested paths
    //    - objectId refs → recursive
    // -----------------------------
    const directConditions: any[] = [];
    const nestedConditions: any[] = [];
    let refConditions: any[] = [];

    const subfields: any[] = Object.values(model.schema['subpaths'])
      .filter((s) => (s as Record<string, any>)['schemaName'] === 'ObjectId')
      .map((s) => (s as Record<string, any>)['path']);

    for (const field of fields) {
      const path = schemaPaths[field];
      const fullPath = parentPath ? `${parentPath}.${field}` : field;
      // A) NESTED PATHS (e.g. profile.name)
      // if (!path && field.includes('.')) {
      //   nestedConditions.push({ [fullPath]: matchValue });
      //   continue;
      // }

      if (!path) continue;

      // B) REF FIELDS: ObjectId with a referenced model
      if (subfields.includes(field) && path.options.type[0]?.ref) {
        const refModelName = path.options.type[0].ref;
        const refModel = this.connection.models[refModelName];
        if (refModel) {
          const refSearch = this.buildSearch(search, refModel, searchFieldMap, options, visitedModels, field);

          if (Object.keys(refSearch).length > 0) {
            // Attach conditions under populate match
            refConditions = [...(refSearch.$or ?? [])];
          }
        }
        continue;
      }

      // C) DIRECT SEARCHABLE FIELDS (String, Number, etc.)
      else {
        directConditions.push({ [fullPath]: matchValue });
      }
    }

    // -----------------------------
    // 3. FULL TEXT SEARCH (if enabled)
    // -----------------------------
    if (options === 'fulltext') {
      return { $text: { $search: search } };
    }

    // -----------------------------
    // 4. Combine all $or conditions
    // -----------------------------
    const allConditions = [...directConditions, ...nestedConditions, ...refConditions.flatMap((c) => c)];
    return allConditions.length > 0 ? ({ $or: allConditions } as FilterQuery<T>) : ({} as FilterQuery<T>);
  };

  // Helper to escape regex safely
}
function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
