'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Building, Users, FileText, CreditCard, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';

interface SearchResult {
  id: string;
  title: string;
  url: string;
  type: 'property' | 'user' | 'contract' | 'payment';
  subtitle?: string;
  metadata?: any;
}

interface SearchResults {
  properties: any[];
  users: any[];
  contracts: any[];
  payments: any[];
  total: number;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar con debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Manejar teclas de navegación
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || !results) return;

      const allResults = getAllResults(results);
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < allResults.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : allResults.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < allResults.length) {
            handleResultClick(allResults[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search/global?q=${encodeURIComponent(searchQuery)}&limit=5`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setResults(result.data);
          setIsOpen(true);
          setSelectedIndex(-1);
        }
      }
    } catch (error) {
      logger.error('Error en búsqueda global:', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const getAllResults = (searchResults: SearchResults): SearchResult[] => {
    const allResults: SearchResult[] = [];
    
    searchResults.properties.forEach(property => {
      allResults.push({
        id: property.id,
        title: property.title,
        subtitle: property.address,
        url: property.url,
        type: 'property',
        metadata: property
      });
    });

    searchResults.users.forEach(user => {
      allResults.push({
        id: user.id,
        title: user.name,
        subtitle: user.email,
        url: user.url,
        type: 'user',
        metadata: user
      });
    });

    searchResults.contracts.forEach(contract => {
      allResults.push({
        id: contract.id,
        title: `Contrato ${contract.propertyTitle}`,
        subtitle: `${contract.tenantName} - ${contract.propertyAddress}`,
        url: contract.url,
        type: 'contract',
        metadata: contract
      });
    });

    searchResults.payments.forEach(payment => {
      allResults.push({
        id: payment.id,
        title: `Pago ${payment.propertyTitle}`,
        subtitle: `$${payment.amount.toLocaleString()} - ${payment.status}`,
        url: payment.url,
        type: 'payment',
        metadata: payment
      });
    });

    return allResults;
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    setIsOpen(false);
    setQuery('');
    setResults(null);
    setSelectedIndex(-1);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'property':
        return <Building className="w-4 h-4" />;
      case 'user':
        return <Users className="w-4 h-4" />;
      case 'contract':
        return <FileText className="w-4 h-4" />;
      case 'payment':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'property':
        return 'Propiedad';
      case 'user':
        return 'Usuario';
      case 'contract':
        return 'Contrato';
      case 'payment':
        return 'Pago';
      default:
        return 'Resultado';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'property':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      case 'contract':
        return 'bg-purple-100 text-purple-800';
      case 'payment':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar propiedades, usuarios, contratos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results && results.total > 0) {
              setIsOpen(true);
            }
          }}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
        )}
        {query && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              setQuery('');
              setResults(null);
              setIsOpen(false);
              setSelectedIndex(-1);
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {isOpen && results && results.total > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            <div className="p-2 text-xs text-gray-500 border-b">
              {results.total} resultado{results.total !== 1 ? 's' : ''} encontrado{results.total !== 1 ? 's' : ''}
            </div>
            
            {getAllResults(results).map((result, index) => (
              <div
                key={`${result.type}-${result.id}`}
                className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                  index === selectedIndex ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getTypeIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </h4>
                      <Badge className={`text-xs ${getTypeColor(result.type)}`}>
                        {getTypeLabel(result.type)}
                      </Badge>
                    </div>
                    {result.subtitle && (
                      <p className="text-xs text-gray-500 truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {isOpen && results && results.total === 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50">
          <CardContent className="p-4 text-center text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No se encontraron resultados para "{query}"</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
