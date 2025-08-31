import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    
    await addToCart(product.id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const imageUrl = product.image_urls && product.image_urls.length > 0 
    ? product.image_urls[0] 
    : 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop';

  return (
    <div className="product-card group">
      <Link to={`/products/${product.slug}`}>
        <div className="relative">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-48 object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop';
            }}
          />
          {product.featured && (
            <Badge className="absolute top-2 left-2 bg-success hover:bg-success">
              Featured
            </Badge>
          )}
          {product.stock_quantity === 0 && (
            <Badge className="absolute top-2 right-2 bg-red-500 hover:bg-red-600">
              Out of Stock
            </Badge>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-neutral-900 group-hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
          
          {product.description && (
            <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
              {product.description}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <span className="price-tag">{formatPrice(product.price)}</span>
            </div>
            
            <div className="flex items-center space-x-1 text-yellow-400">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm text-neutral-600">4.5</span>
            </div>
          </div>
          
          <div className="mt-4">
            <Button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className="w-full bg-success hover:bg-success-600 text-white"
              size="sm"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
          
          {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
            <p className="text-xs text-orange-600 mt-2 text-center">
              Only {product.stock_quantity} left in stock!
            </p>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;