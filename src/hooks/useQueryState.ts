import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useDebouncedCallback } from './useDebounce';

export interface QueryState<TFilters = Record<string, any>> {
  page: number;
  pageSize: number;
  search: string;
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
  filters: TFilters;
}

export interface UseQueryStateOptions<TFilters> {
  initialPage?: number;
  initialPageSize?: number;
  initialSearch?: string;
  initialSortBy?: string | null;
  initialSortOrder?: 'asc' | 'desc';
  initialFilters?: TFilters;
  searchDebounceMs?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearchChange?: (search: string) => void;
  onSortChange?: (sortBy: string | null, sortOrder: 'asc' | 'desc') => void;
  onFiltersChange?: (filters: TFilters) => void;
  onChange?: (state: QueryState<TFilters>) => void;
}

export function useQueryState<TFilters extends Record<string, any> = Record<string, any>>(
  options: UseQueryStateOptions<TFilters> = {}
) {
  const {
    initialPage = 1,
    initialPageSize = 20,
    initialSearch = '',
    initialSortBy = null,
    initialSortOrder = 'asc',
    initialFilters = {} as TFilters,
    searchDebounceMs = 300,
    onPageChange,
    onPageSizeChange,
    onSearchChange,
    onSortChange,
    onFiltersChange,
    onChange,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<string | null>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);
  const [filters, setFilters] = useState<TFilters>(initialFilters);

  const stateRef = useRef<QueryState<TFilters>>({
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
    filters,
  });

  const notifyChange = useCallback((newState: QueryState<TFilters>) => {
    stateRef.current = newState;
    onChange?.(newState);
  }, [onChange]);

  const debouncedSearchChange = useDebouncedCallback((value: string) => {
    onSearchChange?.(value);
    notifyChange({ ...stateRef.current, search: value, page: 1 });
  }, searchDebounceMs);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      onPageChange?.(newPage);
      notifyChange({ ...stateRef.current, page: newPage });
    },
    [onPageChange, notifyChange]
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setPageSize(newSize);
      setPage(1);
      onPageSizeChange?.(newSize);
      notifyChange({ ...stateRef.current, pageSize: newSize, page: 1 });
    },
    [onPageSizeChange, notifyChange]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      setPage(1);
      debouncedSearchChange(value);
    },
    [debouncedSearchChange]
  );

  const handleSortChange = useCallback(
    (column: string) => {
      let newOrder: 'asc' | 'desc' = 'asc';
      if (sortBy === column) {
        newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      }
      setSortBy(column);
      setSortOrder(newOrder);
      onSortChange?.(column, newOrder);
      notifyChange({ ...stateRef.current, sortBy: column, sortOrder: newOrder, page: 1 });
    },
    [sortBy, sortOrder, onSortChange, notifyChange]
  );

  const handleFilterChange = useCallback(
    (key: keyof TFilters, value: any) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      setPage(1);
      onFiltersChange?.(newFilters);
      notifyChange({ ...stateRef.current, filters: newFilters, page: 1 });
    },
    [filters, onFiltersChange, notifyChange]
  );

  const handleFiltersReset = useCallback(() => {
    setFilters(initialFilters);
    setPage(1);
    onFiltersChange?.(initialFilters);
    notifyChange({ ...stateRef.current, filters: initialFilters, page: 1 });
  }, [initialFilters, onFiltersChange, notifyChange]);

  const handleReset = useCallback(() => {
    const newState: QueryState<TFilters> = {
      page: initialPage,
      pageSize: initialPageSize,
      search: initialSearch,
      sortBy: initialSortBy,
      sortOrder: initialSortOrder,
      filters: initialFilters,
    };
    setPage(initialPage);
    setPageSize(initialPageSize);
    setSearch(initialSearch);
    setSortBy(initialSortBy);
    setSortOrder(initialSortOrder);
    setFilters(initialFilters);
    notifyChange(newState);
  }, [
    initialPage,
    initialPageSize,
    initialSearch,
    initialSortBy,
    initialSortOrder,
    initialFilters,
    notifyChange,
  ]);

  const state = useMemo<QueryState<TFilters>>(
    () => ({
      page,
      pageSize,
      search,
      sortBy,
      sortOrder,
      filters,
    }),
    [page, pageSize, search, sortBy, sortOrder, filters]
  );

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  return {
    state,
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
    filters,
    offset,
    setPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    setSearch: handleSearchChange,
    setSort: handleSortChange,
    setFilter: handleFilterChange,
    setFilters: (f: TFilters) => {
      setFilters(f);
      onFiltersChange?.(f);
      notifyChange({ ...stateRef.current, filters: f, page: 1 });
    },
    resetFilters: handleFiltersReset,
    reset: handleReset,
    nextPage: () => handlePageChange(page + 1),
    prevPage: () => handlePageChange(page - 1),
    goToPage: handlePageChange,
  };
}
