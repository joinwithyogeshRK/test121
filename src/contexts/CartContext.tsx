import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CartItem, Product, CartContextType } from '../types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      setItems([]);
    }
  }, [user]);

  const fetchCartItems = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data: cartData, error: cartError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id);
      
      if (cartError) throw cartError;
      
      if (cartData && cartData.length > 0) {
        const productIds = cartData.map(item => item.product_id);
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);
        
        if (productsError) throw productsError;
        
        const itemsWithProducts = cartData.map(cartItem => ({
          ...cartItem,
          product: productsData?.find(p => p.id === cartItem.product_id)
        }));
        
        setItems(itemsWithProducts);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
      toast.error('Failed to load cart items');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }
    
    try {
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();
      
      if (existingItem) {
        await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);
      } else {
        await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity
          });
      }
      
      await fetchCartItems();
      toast.success('Item added to cart!');
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      await fetchCartItems();
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Remove from cart error:', error);
      toast.error('Failed to remove item from cart');
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);
      
      if (error) throw error;
      
      await fetchCartItems();
    } catch (error) {
      console.error('Update quantity error:', error);
      toast.error('Failed to update quantity');
    }
  };

  const clearCart = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setItems([]);
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Clear cart error:', error);
      toast.error('Failed to clear cart');
    }
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      const price = item.product?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const value: CartContextType = {
    items,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};