import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import CartItem from '../components/CartItem';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const Cart = () => {
  const { items, loading, getTotalItems, getTotalPrice } = useCart();
  const { user } = useAuth();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-16">
          <div className="text-center">
            <ShoppingBag className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Please Login to View Your Cart
            </h2>
            <p className="text-neutral-600 mb-8">
              You need to be logged in to access your shopping cart.
            </p>
            <div className="flex justify-center space-x-4">
              <Button asChild className="bg-primary hover:bg-primary-600">
                <Link to="/login">Login</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-8">
          <div className="animate-pulse space-y-4">
            <div className="bg-neutral-200 h-8 w-48 rounded"></div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 border">
                <div className="flex space-x-4">
                  <div className="bg-neutral-200 w-16 h-16 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="bg-neutral-200 h-4 w-3/4 rounded"></div>
                    <div className="bg-neutral-200 h-3 w-1/2 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-16">
          <div className="text-center">
            <ShoppingBag className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Your Cart is Empty
            </h2>
            <p className="text-neutral-600 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Button asChild className="bg-primary hover:bg-primary-600">
              <Link to="/products">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">
            Shopping Cart ({getTotalItems()} items)
          </h1>
          <Button variant="outline" asChild>
            <Link to="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="space-y-0">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-neutral-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Order Summary
              </h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Subtotal ({getTotalItems()} items)</span>
                  <span className="font-medium">{formatPrice(getTotalPrice())}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Shipping</span>
                  <span className="font-medium text-success">Free</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Tax</span>
                  <span className="font-medium">{formatPrice(getTotalPrice() * 0.08)}</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-neutral-900">Total</span>
                    <span className="text-lg font-semibold text-neutral-900">
                      {formatPrice(getTotalPrice() * 1.08)}
                    </span>
                  </div>
                </div>
              </div>
              
              <Button asChild className="w-full bg-success hover:bg-success-600 text-white" size="lg">
                <Link to="/checkout">
                  Proceed to Checkout
                </Link>
              </Button>
              
              <p className="text-xs text-neutral-600 text-center mt-4">
                Secure checkout with SSL encryption
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;