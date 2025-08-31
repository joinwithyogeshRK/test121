import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import ProductFilters from '../components/ProductFilters';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Filter } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    category_id: searchParams.get('category') || undefined,
    price_min: searchParams.get('price_min') ? parseFloat(searchParams.get('price_min')!) : undefined,
    price_max: searchParams.get('price_max') ? parseFloat(searchParams.get('price_max')!) : undefined,
    search: searchParams.get('search') || undefined,
    featured: searchParams.get('featured') === 'true' || undefined,
    in_stock: searchParams.get('in_stock') === 'true' || undefined,
    sort_by: searchParams.get('sort_by') || 'created_at',
    sort_order: searchParams.get('sort_order') || 'desc',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    updateSearchParams();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      
      if (filters.price_min !== undefined) {
        query = query.gte('price', filters.price_min);
      }
      
      if (filters.price_max !== undefined) {
        query = query.lte('price', filters.price_max);
      }
      
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      
      if (filters.featured) {
        query = query.eq('featured', true);
      }
      
      if (filters.in_stock) {
        query = query.gt('stock_quantity', 0);
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'created_at';
      const sortOrder = filters.sort_order === 'asc';
      query = query.order(sortBy, { ascending: sortOrder });

      const { data, error } = await query;
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const updateSearchParams = () => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      }
    });
    
    setSearchParams(params);
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      category_id: undefined,
      price_min: undefined,
      price_max: undefined,
      search: undefined,
      featured: undefined,
      in_stock: undefined,
      sort_by: 'created_at',
      sort_order: 'desc',
    };
    setFilters(clearedFilters);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Products</h1>
            <p className="text-neutral-600 mt-2">
              {loading ? 'Loading...' : `${products.length} products found`}
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <ProductFilters
              categories={categories}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <ProductGrid products={products} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;