import React from 'react';
import ProductCard from './ProductCard';
import { Product } from '../types';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, loading = false }) => {
  if (loading) {
    return (
      <div className="product-grid">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="product-card animate-pulse">
            <div className="bg-neutral-200 h-48 w-full"></div>
            <div className="p-4 space-y-3">
              <div className="bg-neutral-200 h-4 w-3/4 rounded"></div>
              <div className="bg-neutral-200 h-3 w-full rounded"></div>
              <div className="bg-neutral-200 h-3 w-2/3 rounded"></div>
              <div className="flex justify-between items-center">
                <div className="bg-neutral-200 h-6 w-16 rounded"></div>
                <div className="bg-neutral-200 h-4 w-12 rounded"></div>
              </div>
              <div className="bg-neutral-200 h-8 w-full rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-neutral-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4a1 1 0 00-1-1H9a1 1 0 00-1 1v1" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-neutral-900 mb-2">No products found</h3>
        <p className="text-neutral-600">Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;