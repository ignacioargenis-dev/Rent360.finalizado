import { useState, useCallback } from 'react';

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UsePaginationProps {
  initialPage?: number;
  initialLimit?: number;
  totalItems?: number;
}

export function usePagination({
  initialPage = 1,
  initialLimit = 10,
  totalItems = 0,
}: UsePaginationProps = {}) {

  const [page, setPage] = useState(initialPage);

  const [limit, setLimit] = useState(initialLimit);

  const [total, setTotal] = useState(totalItems);

  const totalPages = Math.ceil(total / limit) || 1;

  const goToPage = useCallback((newPage: number) => {
    const validatedPage = Math.max(1, Math.min(newPage, totalPages));
    setPage(validatedPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(page + 1);
  }, [page, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(page - 1);
  }, [page, goToPage]);

  const setItemsPerPage = useCallback((newLimit: number) => {
    const validatedLimit = Math.max(1, newLimit);
    setLimit(validatedLimit);
    setPage(1); // Reset to first page when changing items per page
  }, []);

  const updateTotal = useCallback((newTotal: number) => {
    setTotal(newTotal);
    // Adjust current page if it exceeds new total pages
    const newTotalPages = Math.ceil(newTotal / limit);
    if (page > newTotalPages && newTotalPages > 0) {
      setPage(newTotalPages);
    }
  }, [page, limit]);

  const getPaginationState = (): PaginationState => ({
    page,
    limit,
    total,
    totalPages,
  });

  const getOffset = (): number => (page - 1) * limit;

  const getPageRange = (): { start: number; end: number } => {
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    return { start, end };
  };

  return {
    // State
    page,
    limit,
    total,
    totalPages,
    
    // Actions
    goToPage,
    nextPage,
    prevPage,
    setItemsPerPage,
    updateTotal,
    
    // Utilities
    getPaginationState,
    getOffset,
    getPageRange,
    
    // Derived state
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    isFirstPage: page === 1,
    isLastPage: page === totalPages,
  };
}

export type UsePaginationReturn = ReturnType<typeof usePagination>;
