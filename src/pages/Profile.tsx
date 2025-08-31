import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Package, Settings, Edit2, Save, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Order, Profile as ProfileType } from '../types';
import { toast } from 'sonner';

const Profile = () => {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    }
  });

  const defaultTab = searchParams.get('tab') || 'profile';

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: ''
        }
      });
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          if (itemsError) {
            console.error('Error fetching order items:', itemsError);
            return { ...order, order_items: [] };
          }

          return { ...order, order_items: itemsData || [] };
        })
      );

      setOrders(ordersWithItems);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          address: profileData.address
        })
        .eq('id', user!.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      setEditingProfile(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'processing':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'delivered':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-neutral-100 text-neutral-800 hover:bg-neutral-100';
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <User className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            Please Login
          </h2>
          <p className="text-neutral-600 mb-8">
            You need to be logged in to view your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">
              My Account
            </h1>
            <p className="text-neutral-600 mt-2">
              Manage your profile and view your orders
            </p>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-8">
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-neutral-900">
                  Profile Information
                </h3>
                {!editingProfile ? (
                  <Button
                    variant="outline"
                    onClick={() => setEditingProfile(true)}
                    className="text-primary border-primary hover:bg-primary-50"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleProfileUpdate}
                      className="bg-success hover:bg-success-600 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingProfile(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  {editingProfile ? (
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-neutral-900">{profile.full_name || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <p className="mt-1 text-neutral-900">{profile.email}</p>
                  <p className="text-xs text-neutral-600 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  {editingProfile ? (
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-neutral-900">{profile.phone || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <p className="mt-1">
                    <Badge className={profile.role === 'admin' ? 'bg-primary-100 text-primary-800 hover:bg-primary-100' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-100'}>
                      {profile.role === 'admin' ? 'Administrator' : 'Customer'}
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-md font-semibold text-neutral-900 mb-4">Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="street">Street Address</Label>
                    {editingProfile ? (
                      <Input
                        id="street"
                        value={profileData.address.street}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          address: { ...prev.address, street: e.target.value }
                        }))}
                        placeholder="123 Main Street"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-neutral-900">{profile.address?.street || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="city">City</Label>
                    {editingProfile ? (
                      <Input
                        id="city"
                        value={profileData.address.city}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          address: { ...prev.address, city: e.target.value }
                        }))}
                        placeholder="New York"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-neutral-900">{profile.address?.city || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="state">State</Label>
                    {editingProfile ? (
                      <Input
                        id="state"
                        value={profileData.address.state}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          address: { ...prev.address, state: e.target.value }
                        }))}
                        placeholder="NY"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-neutral-900">{profile.address?.state || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="zip">ZIP Code</Label>
                    {editingProfile ? (
                      <Input
                        id="zip"
                        value={profileData.address.zip}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          address: { ...prev.address, zip: e.target.value }
                        }))}
                        placeholder="10001"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-neutral-900">{profile.address?.zip || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    {editingProfile ? (
                      <Input
                        id="country"
                        value={profileData.address.country}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          address: { ...prev.address, country: e.target.value }
                        }))}
                        placeholder="United States"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-neutral-900">{profile.address?.country || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-8">
            <div className="space-y-6">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border border-neutral-200 p-6 animate-pulse">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2">
                          <div className="bg-neutral-200 h-4 w-32 rounded"></div>
                          <div className="bg-neutral-200 h-3 w-24 rounded"></div>
                        </div>
                        <div className="bg-neutral-200 h-6 w-20 rounded"></div>
                      </div>
                      <div className="bg-neutral-200 h-4 w-48 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No orders yet</h3>
                  <p className="text-neutral-600 mb-8">When you make your first purchase, it will appear here.</p>
                  <Button asChild className="bg-primary hover:bg-primary-600">
                    <a href="/products">Start Shopping</a>
                  </Button>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg border border-neutral-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-neutral-900">
                          Order #{order.id.slice(0, 8)}
                        </h4>
                        <p className="text-sm text-neutral-600">
                          Placed on {formatDate(order.created_at)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-neutral-600">
                            {item.product_name} × {item.quantity}
                          </span>
                          <span className="font-medium">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-neutral-200">
                      <div className="text-sm text-neutral-600">
                        <p><strong>Shipping:</strong> {order.shipping_address.street.split('\n')[0]}</p>
                        <p><strong>Payment:</strong> {order.payment_status}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-neutral-900">
                          Total: {formatPrice(order.total_amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;