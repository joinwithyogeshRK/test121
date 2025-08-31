import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Category } from '../types';

interface ProductFiltersProps {
  categories: Category[];
  filters: {
    category_id?: string;
    price_min?: number;
    price_max?: number;
    search?: string;
    featured?: boolean;
    in_stock?: boolean;
    sort_by?: string;
    sort_order?: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handlePriceChange = (key: 'price_min' | 'price_max', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    handleFilterChange(key, numValue);
  };

  return (
    <div className="sidebar-nav p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-primary hover:text-primary-600 hover:bg-primary-50"
        >
          Clear All
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="search" className="text-sm font-medium text-neutral-700">
            Search Products
          </Label>
          <Input
            id="search"
            type="text"
            placeholder="Search by name..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-neutral-700">Category</Label>
          <Select
            value={filters.category_id || 'all'}
            onValueChange={(value) => handleFilterChange('category_id', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-neutral-700 mb-2 block">
            Price Range
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="price_min" className="text-xs text-neutral-600">
                Min Price
              </Label>
              <Input
                id="price_min"
                type="number"
                placeholder="$0"
                value={filters.price_min || ''}
                onChange={(e) => handlePriceChange('price_min', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="price_max" className="text-xs text-neutral-600">
                Max Price
              </Label>
              <Input
                id="price_max"
                type="number"
                placeholder="$1000"
                value={filters.price_max || ''}
                onChange={(e) => handlePriceChange('price_max', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-neutral-700">Options</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={filters.featured || false}
                onCheckedChange={(checked) => handleFilterChange('featured', checked)}
              />
              <Label htmlFor="featured" className="text-sm text-neutral-700">
                Featured Products
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="in_stock"
                checked={filters.in_stock || false}
                onCheckedChange={(checked) => handleFilterChange('in_stock', checked)}
              />
              <Label htmlFor="in_stock" className="text-sm text-neutral-700">
                In Stock Only
              </Label>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-neutral-700">Sort By</Label>
          <Select
            value={`${filters.sort_by || 'created_at'}_${filters.sort_order || 'desc'}`}
            onValueChange={(value) => {
              const [sort_by, sort_order] = value.split('_');
              onFiltersChange({ ...filters, sort_by, sort_order });
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at_desc">Newest First</SelectItem>
              <SelectItem value="created_at_asc">Oldest First</SelectItem>
              <SelectItem value="name_asc">Name A-Z</SelectItem>
              <SelectItem value="name_desc">Name Z-A</SelectItem>
              <SelectItem value="price_asc">Price Low to High</SelectItem>
              <SelectItem value="price_desc">Price High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;