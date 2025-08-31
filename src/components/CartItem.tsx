import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { CartItem as CartItemType } from '../types';
import { useCart } from '../contexts/CartContext';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(item.id);
    } else {
      await updateQuantity(item.id, newQuantity);
    }
  };

  const handleRemove = async () => {
    await removeFromCart(item.id);
  };

  if (!item.product) {
    return null;
  }

  const imageUrl = item.product.image_urls && item.product.image_urls.length > 0
    ? item.product.image_urls[0]
    : 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop';

  const totalPrice = item.product.price * item.quantity;

  return (
    <div className="flex items-center space-x-4 py-4 border-b border-neutral-200">
      <div className="flex-shrink-0">
        <Link to={`/products/${item.product.slug}`}>
          <img
            src={imageUrl}
            alt={item.product.name}
            className="w-16 h-16 object-cover rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop';
            }}
          />
        </Link>
      </div>

      <div className="flex-1 min-w-0">
        <Link
          to={`/products/${item.product.slug}`}
          className="text-sm font-medium text-neutral-900 hover:text-primary transition-colors"
        >
          {item.product.name}
        </Link>
        <p className="text-sm text-neutral-600 mt-1">
          {formatPrice(item.product.price)} each
        </p>
        {item.product.stock_quantity <= 5 && (
          <p className="text-xs text-orange-600 mt-1">
            Only {item.product.stock_quantity} left in stock
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={item.quantity <= 1}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center text-sm font-medium">
          {item.quantity}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={item.quantity >= item.product.stock_quantity}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <div className="text-right">
        <p className="text-sm font-medium text-neutral-900">
          {formatPrice(totalPrice)}
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-neutral-400 hover:text-red-600"
        onClick={handleRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default CartItem;