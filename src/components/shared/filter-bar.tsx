'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Search, X } from 'lucide-react'

interface FilterOption {
  label: string
  value: string
  count?: number
}

interface FilterBarProps {
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  filters?: FilterOption[]
  activeFilters?: string[]
  onFilterChange?: (value: string) => void
  onClearFilters?: () => void
  className?: string
}

export function FilterBar({
  searchPlaceholder = 'Rechercher...',
  searchValue,
  onSearchChange,
  filters = [],
  activeFilters = [],
  onFilterChange,
  onClearFilters,
  className,
}: FilterBarProps) {
  const hasActiveFilters = activeFilters.length > 0 || (searchValue && searchValue.length > 0)

  return (
    <div className={cn('flex flex-col sm:flex-row gap-3', className)}>
      {onSearchChange && (
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      )}
      
      {filters.length > 0 && onFilterChange && (
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((filter) => {
            const isActive = activeFilters.includes(filter.value)
            return (
              <Button
                key={filter.value}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange(filter.value)}
                className="h-8 text-xs"
              >
                {filter.label}
                {filter.count !== undefined && (
                  <span className="ml-1.5 text-muted-foreground">{filter.count}</span>
                )}
              </Button>
            )
          })}
        </div>
      )}

      {hasActiveFilters && onClearFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-8 text-xs text-muted-foreground"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Effacer
        </Button>
      )}
    </div>
  )
}
