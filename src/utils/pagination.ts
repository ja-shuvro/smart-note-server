import { PaginationMeta } from './api-response.js';

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export const parsePagination = (
  queryPage?: unknown,
  queryLimit?: unknown,
  defaultLimit = 10,
  maxLimit = 100
): PaginationOptions => {
  let page = parseInt(String(queryPage || 1), 10);
  let limit = parseInt(String(queryLimit || defaultLimit), 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const createPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};
