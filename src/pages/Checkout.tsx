import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const Checkout = () => {
  const { items, getTotalItems, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Shipping Address
    shipping_street: '',
    shipping_city: '',
    shipping_state: '',
    shipping_zip: '',
    shipping_country: 'United States',
    
    // Billing Address
    same_as_shipping: true,
    billing_street: '',
    billing_city: '',
    billing_state: '',
    billing_zip: '',
    billing_country: 'United States',
    
    // Payment
    payment_method: 'credit_card',
    card_number: '',
    card_expiry: '',
    card_cvc: '',
    card_name: '',
    
    // Order Notes
    notes: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
  }, [user, items, navigate]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const required = [
      'shipping_street', 'shipping_city', 'shipping_state', 'shipping_zip',
      'card_number', 'card_expiry', 'card_cvc', 'card_name'
    ];
    
    if (!formData.same_as_shipping) {
      required.push('billing_street', 'billing_city', 'billing_state', 'billing_zip');
    }
    
    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`Please fill in all required fields`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const shippingAddress = {
        street: formData.shipping_street,
        city: formData.shipping_city,
        state: formData.shipping_state,
        zip: formData.shipping_zip,
        country: formData.shipping_country
      };
      
      const billingAddress = formData.same_as_shipping ? shippingAddress : {
        street: formData.billing_street,
        city: formData.billing_city,
        state: formData.billing_state,
        zip: formData.billing_zip,
        country: formData.billing_country
      };
      
      const totalAmount = getTotalPrice() * 1.08; // Including tax
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          status: 'pending',
          total_amount: totalAmount,
          shipping_address: shippingAddress,
          billing_address: billingAddress,
          payment_status: 'pending',
          payment_method: formData.payment_method,
          notes: formData.notes || null
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product?.price || 0,
        product_name: item.product?.name || '',
        product_image_url: item.product?.image_urls?.[0] || null
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // Update product stock
      for (const item of items) {
        if (item.product) {
          await supabase
            .from('products')
            .update({ 
              stock_quantity: Math.max(0, item.product.stock_quantity - item.quantity) 
            })
            .eq('id', item.product.id);
        }
      }
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update order status
      await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          status: 'processing'
        })
        .eq('id', order.id);
      
      // Clear cart
      await clearCart();
      
      toast.success('Order placed successfully!');
      navigate('/profile?tab=orders');
      
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (!user || items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Checkout</h1>
          <Button variant="outline" onClick={() => navigate('/cart')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Shipping Address */}
              <div className="bg-white rounded-lg border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Shipping Address
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="shipping_street">Street Address *</Label>
                    <Input
                      id="shipping_street"
                      value={formData.shipping_street}
                      onChange={(e) => handleInputChange('shipping_street', e.target.value)}
                      placeholder="123 Main Street"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="shipping_city">City *</Label>
                    <Input
                      id="shipping_city"
                      value={formData.shipping_city}
                      onChange={(e) => handleInputChange('shipping_city', e.target.value)}
                      placeholder="New York"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="shipping_state">State *</Label>
                    <Input
                      id="shipping_state"
                      value={formData.shipping_state}
                      onChange={(e) => handleInputChange('shipping_state', e.target.value)}
                      placeholder="NY"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="shipping_zip">ZIP Code *</Label>
                    <Input
                      id="shipping_zip"
                      value={formData.shipping_zip}
                      onChange={(e) => handleInputChange('shipping_zip', e.target.value)}
                      placeholder="10001"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="shipping_country">Country *</Label>
                    <Select
                      value={formData.shipping_country}
                      onValueChange={(value) => handleInputChange('shipping_country', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="United States">United States</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-lg border border-neutral-200 p-6">
                <div className="flex items-center mb-4">
                  <Lock className="h-5 w-5 text-success mr-2" />
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Payment Information
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => handleInputChange('payment_method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="debit_card">Debit Card</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="card_name">Cardholder Name *</Label>
                    <Input
                      id="card_name"
                      value={formData.card_name}
                      onChange={(e) => handleInputChange('card_name', e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="card_number">Card Number *</Label>
                    <Input
                      id="card_number"
                      value={formData.card_number}
                      onChange={(e) => handleInputChange('card_number', e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="card_expiry">Expiry Date *</Label>
                      <Input
                        id="card_expiry"
                        value={formData.card_expiry}
                        onChange={(e) => handleInputChange('card_expiry', e.target.value)}
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="card_cvc">CVC *</Label>
                      <Input
                        id="card_cvc"
                        value={formData.card_cvc}
                        onChange={(e) => handleInputChange('card_cvc', e.target.value)}
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Notes */}
              <div className="bg-white rounded-lg border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Order Notes (Optional)
                </h3>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any special instructions for your order..."
                  rows={3}
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-neutral-200 p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Order Summary
                </h3>
                
                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-neutral-600">
                        {item.product?.name} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatPrice((item.product?.price || 0) * item.quantity)}
                      </span>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Subtotal</span>
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
                    
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-lg font-semibold text-neutral-900">Total</span>
                      <span className="text-lg font-semibold text-neutral-900">
                        {formatPrice(getTotalPrice() * 1.08)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-success hover:bg-success-600 text-white"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Place Order
                    </div>
                  )}
                </Button>
                
                <p className="text-xs text-neutral-600 text-center mt-4">
                  <Lock className="inline h-3 w-3 mr-1" />
                  Secure checkout with SSL encryption
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;