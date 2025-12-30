import type { Request } from 'express';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { PipelineStage } from 'mongoose';

import { QueryOptionsMongoDto } from '../dtos/query.options.dto';
import { QueryFilterService } from './query-filter.service';
import { QuerySearchService } from './query-search.service';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.REQUEST })
export class QueryService {
  constructor(
    @Inject(REQUEST)
    private readonly request: Request,

    private readonly querySearchService: QuerySearchService,

    private readonly queryFilterService: QueryFilterService
  ) {}

  public async query<T, M extends Record<string, any>>(options: QueryOptionsMongoDto<T, M>) {

    const { query, model, searchFieldMap, relations, searchOptions = 'partial' } = options;

    // -----------------------------
    // 1. Build search conditions
    // -----------------------------
    // Convert search string into MongoDB query object.
    // Example output: { name: { $regex: /po/i } }
    const search = query.search
      ? this.querySearchService.buildSearch(query.search || '', model, searchFieldMap, searchOptions)
      : {};

    const filter = query.filters ? this.queryFilterService.buildFilter(model, query.filters) : {};

    // Merge search into mongoQuery object
    // const mongoQuery: QueryOptions = { ...search };

    // -----------------------------
    // 2. Pagination setup
    // -----------------------------
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    // -----------------------------
    // 3. Aggregation pipeline
    // -----------------------------
    const pipeline: PipelineStage[] = [];

    // 3a. Add $lookup for relations (e.g., authors)
    relations?.forEach((relation) => {
      pipeline.push({
        $lookup: {
          from: relation, // collection name in MongoDB
          localField: relation, // field in main document
          foreignField: '_id', // field in related collection
          as: relation, // result array will be stored in this field
        },
      });
    });
    if (filter && Object.keys(filter).length > 0) {
      pipeline.push({ $match: filter });
    }
    // 3b. Add $match stage for search conditions
    if (search && Object.keys(search).length > 0) {
      pipeline.push({ $match: search });
    }

    // -----------------------------
    // 4. Count pipeline for total items
    // -----------------------------
    // Copy pipeline and append $count to get total items
    const countPipeline = [...pipeline, { $count: 'total' }];

    // -----------------------------
    // 5. Sorting
    // -----------------------------
    if (query.sortBy) {
      const sort: Record<string, 1 | -1> = {};
      sort[query.sortBy] = query.sortOrder === 'DESC' ? -1 : 1;
      pipeline.push({ $sort: sort });
    }

    // -----------------------------
    // 6. Pagination in aggregation
    // -----------------------------
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // -----------------------------
    // 7. Execute aggregation query
    // -----------------------------
    const dbQuery = model.aggregate(pipeline);

    // 7a. Execute both query and count in parallel
    const [result, totalItems] = await Promise.all([
      dbQuery.exec(),
      model
        .aggregate(countPipeline)
        .exec()
        .then((res) => res[0]?.total || 0),
    ]);

    // -----------------------------
    // 8. Build new URL for pagination links
    // -----------------------------
    const base = `${this.request?.protocol}://${this.request?.headers.host}/`;
    const newUrl = this.request ? new URL(this.request.url, base): new URL(base);

    // -----------------------------
    // 9. Return results
    // -----------------------------
    return { result, totalItems, newUrl };
  }
}
