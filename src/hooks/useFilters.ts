import { useState, useCallback, useMemo } from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date' | 'number' | 'boolean';
  options?: FilterOption[];
  placeholder?: string;
}

export interface FilterState {
  [key: string]: any;
}

export interface UseFiltersProps {
  initialFilters?: FilterState;
  fields: FilterField[];
}

export function useFilters({ initialFilters = {}, fields }: UseFiltersProps) {

  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' || value === undefined ? null : value,
    }));
  }, []);

  const updateMultipleFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(newFilters).map(([key, value]) => [
          key,
          value === '' || value === undefined ? null : value,
        ]),
      ),
    }));
  }, []);

  const clearFilter = useCallback((key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value !== null && value !== undefined && value !== '');
  }, [filters]);

  const getActiveFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value !== null && value !== undefined && value !== '').length;
  }, [filters]);

  const getFilterValue = useCallback((key: string) => {
    return filters[key];
  }, [filters]);

  const getFilterLabel = useCallback((key: string, value: any): string => {
    const field = fields.find(f => f.key === key);
    if (!field) {
return String(value);
}

    switch (field.type) {
      case 'select':
        const option = field.options?.find(opt => opt.value === value);
        return option?.label || String(value);
      case 'boolean':
        return value ? 'Sí' : 'No';
      case 'date':
        return value ? new Date(value).toLocaleDateString('es-CL') : '';
      default:
        return String(value);
    }
  }, [fields]);

  const getFilterQueryParams = useCallback((): string => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    
    return params.toString();
  }, [filters]);

  const setFiltersFromQueryParams = useCallback((searchParams: URLSearchParams) => {
    const newFilters: FilterState = {};
    
    fields.forEach(field => {
      const value = searchParams.get(field.key);
      if (value) {
        // Convert value based on field type
        switch (field.type) {
          case 'number':
            newFilters[field.key] = Number(value);
            break;
          case 'boolean':
            newFilters[field.key] = value.toLowerCase() === 'true';
            break;
          case 'date':
            newFilters[field.key] = value;
            break;
          default:
            newFilters[field.key] = value;
        }
      }
    });
    
    setFilters(newFilters);
  }, [fields]);

  const getFilterFields = useCallback(() => {
    return fields.map(field => ({
      ...field,
      value: filters[field.key] || '',
      onChange: (value: any) => updateFilter(field.key, value),
    }));
  }, [fields, filters, updateFilter]);

  return {
    // State
    filters,
    
    // Actions
    updateFilter,
    updateMultipleFilters,
    clearFilter,
    clearAllFilters,
    
    // Utilities
    hasActiveFilters,
    getActiveFiltersCount,
    getFilterValue,
    getFilterLabel,
    getFilterQueryParams,
    setFiltersFromQueryParams,
    getFilterFields,
  };
}

export type UseFiltersReturn = ReturnType<typeof useFilters>;
