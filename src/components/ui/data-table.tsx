'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpDown,
  Download,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { usePagination, UsePaginationProps } from '@/hooks/usePagination';
import { useFilters, UseFiltersProps, FilterField } from '@/hooks/useFilters';

export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  pagination?: UsePaginationProps;
  filters?: UseFiltersProps;
  loading?: boolean;
  searchable?: boolean;
  exportable?: boolean;
  refreshable?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, any>) => void;
  className?: string;
  emptyMessage?: string;
  loadingMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  pagination,
  filters,
  loading = false,
  searchable = true,
  exportable = true,
  refreshable = true,
  onRefresh,
  onExport,
  onSort,
  onFilter,
  className = '',
  emptyMessage = 'No hay datos disponibles',
  loadingMessage = 'Cargando datos...',
}: DataTableProps<T>) {

  const [searchTerm, setSearchTerm] = useState('');

  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: 'asc' | 'desc';
  } | null>(null);

  const paginationHook = usePagination(pagination || {});
  const filtersHook = useFilters(filters || { fields: [] });

  // Update total items when data changes
  useEffect(() => {
    if (pagination) {
      paginationHook.updateTotal(data.length);
    }
  }, [data, pagination, paginationHook]);

  // Filter and sort data
  const filteredAndSortedData = React.useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      );
    }

    // Apply custom filters
    if (filtersHook?.hasActiveFilters && onFilter) {
      onFilter(filtersHook.filters);
    }

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
return sortConfig.direction === 'asc' ? -1 : 1;
}
        if (aValue > bValue) {
return sortConfig.direction === 'asc' ? 1 : -1;
}
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig, filtersHook, onFilter]);

  // Get paginated data
  const paginatedData = React.useMemo(() => {
    if (!pagination) {
return filteredAndSortedData;
}
    
    const offset = paginationHook.getOffset();
    return filteredAndSortedData.slice(offset, offset + paginationHook.limit);
  }, [filteredAndSortedData, pagination, paginationHook]);

  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    
    setSortConfig({ key, direction });
    onSort?.(key, direction);
  };

  const getSortIcon = (key: keyof T) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
  };

  const renderCell = (item: T, column: DataTableColumn<T>) => {
    const value = item[column.key];
    
    if (column.render) {
      return column.render(value, item);
    }
    
    // Default rendering based on value type
    if (value === null || value === undefined) {
      return <span className="text-gray-400">-</span>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Sí' : 'No'}
        </Badge>
      );
    }
    
    if (typeof value === 'object') {
      return <span className="text-sm">{JSON.stringify(value)}</span>;
    }
    
    return <span className="text-sm">{String(value)}</span>;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">{loadingMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tabla de Datos</CardTitle>
            <CardDescription>
              {pagination && (
                `Mostrando ${paginationHook.getPageRange().start} - ${paginationHook.getPageRange().end} de ${paginationHook.total} resultados`
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {refreshable && onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            )}
            {exportable && onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            )}
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {searchable && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          
          {filtersHook && (
            <div className="flex items-center gap-2">
              {filtersHook.getFilterFields().map((field) => (
                <div key={field.key} className="flex items-center gap-2">
                  {field.type === 'select' && (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {field.type === 'text' && (
                    <Input
                      placeholder={field.placeholder}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-40"
                    />
                  )}
                  
                  {field.value && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => filtersHook?.clearFilter(field.key)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              {filtersHook.hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={filtersHook.clearAllFilters}>
                  <Filter className="w-4 h-4 mr-2" />
                  Limpiar filtros ({filtersHook.getActiveFiltersCount})
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {paginatedData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={String(column.key)} className={column.className}>
                        {column.sortable ? (
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-semibold hover:bg-transparent"
                            onClick={() => handleSort(column.key)}
                          >
                            {column.label}
                            <span className="ml-2">{getSortIcon(column.key)}</span>
                          </Button>
                        ) : (
                          <span className="font-semibold">{column.label}</span>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item, index) => (
                    <TableRow key={item.id || index}>
                      {columns.map((column) => (
                        <TableCell key={String(column.key)} className={column.className}>
                          {renderCell(item, column)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {pagination && paginationHook.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Items por página:
                  </span>
                  <Select
                    value={String(paginationHook.limit)}
                    onValueChange={(value) => paginationHook.setItemsPerPage(Number(value))}
                  >
                    <SelectTrigger className="w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={paginationHook.prevPage}
                        className={!paginationHook.hasPrevPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, paginationHook.totalPages) }, (_, i) => {
                      let pageNum;
                      const currentPage = paginationHook.page;
                      const totalPages = paginationHook.totalPages;
                      
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => paginationHook.goToPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    {paginationHook.totalPages > 5 && paginationHook.page < paginationHook.totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={paginationHook.nextPage}
                        className={!paginationHook.hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
