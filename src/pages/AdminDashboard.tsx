import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Product, Order, Profile, Category } from '../types';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Eye,
  X,
  Check,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  recentOrders: Order[];
}

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  price: number;
  category_id: string;
  stock_quantity: number;
  image_urls: string[];
  is_active: boolean;
  featured: boolean;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

interface OrderUpdateData {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  tracking_number: string;
  notes: string;
}

interface UserUpdateData {
  full_name: string;
  role: 'user' | 'admin';
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

const AdminDashboard: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    recentOrders: []
  });
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Form states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: string; id: string; name: string } | null>(null);
  
  // Search and filter states
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Form data states
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    price: 0,
    category_id: '',
    stock_quantity: 0,
    image_urls: [''],
    is_active: true,
    featured: false,
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 }
  });
  
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    is_active: true
  });
  
  const [orderForm, setOrderForm] = useState<OrderUpdateData>({
    status: 'pending',
    payment_status: 'pending',
    tracking_number: '',
    notes: ''
  });
  
  const [userForm, setUserForm] = useState<UserUpdateData>({
    full_name: '',
    role: 'user',
    phone: '',
    address: { street: '', city: '', state: '', zip: '', country: '' }
  });

  // Authentication check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary">
        <div className="text-center p-8 bg-white rounded-card shadow-card">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">Access Denied</h1>
          <p className="text-neutral-600">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  // Toast notification component
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Data fetching functions
  const fetchStats = async () => {
    try {
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact' }),
        supabase.from('orders').select('*', { count: 'exact' }).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*', { count: 'exact' })
      ]);

      if (productsRes.error) throw productsRes.error;
      if (ordersRes.error) throw ordersRes.error;
      if (usersRes.error) throw usersRes.error;

      const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const recentOrders = ordersRes.data?.slice(0, 5) || [];

      setStats({
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalRevenue,
        recentOrders
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      showToast('Failed to load dashboard stats', 'error');
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast('Failed to load products', 'error');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showToast('Failed to load categories', 'error');
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('Failed to load orders', 'error');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to load users', 'error');
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchProducts(),
        fetchCategories(),
        fetchOrders(),
        fetchUsers()
      ]);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Operations for Products
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('products')
        .insert([productForm]);

      if (error) throw error;
      
      showToast('Product created successfully', 'success');
      setShowProductModal(false);
      resetProductForm();
      fetchProducts();
      fetchStats();
    } catch (error) {
      console.error('Error creating product:', error);
      showToast('Failed to create product', 'error');
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ ...productForm, updated_at: new Date().toISOString() })
        .eq('id', editingProduct.id);

      if (error) throw error;
      
      showToast('Product updated successfully', 'success');
      setShowProductModal(false);
      setEditingProduct(null);
      resetProductForm();
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      showToast('Failed to update product', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      showToast('Product deleted successfully', 'success');
      setShowDeleteModal(false);
      setDeleteItem(null);
      fetchProducts();
      fetchStats();
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Failed to delete product', 'error');
    }
  };

  // CRUD Operations for Categories
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('categories')
        .insert([categoryForm]);

      if (error) throw error;
      
      showToast('Category created successfully', 'success');
      setShowCategoryModal(false);
      resetCategoryForm();
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      showToast('Failed to create category', 'error');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({ ...categoryForm, updated_at: new Date().toISOString() })
        .eq('id', editingCategory.id);

      if (error) throw error;
      
      showToast('Category updated successfully', 'success');
      setShowCategoryModal(false);
      setEditingCategory(null);
      resetCategoryForm();
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      showToast('Failed to update category', 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      showToast('Category deleted successfully', 'success');
      setShowDeleteModal(false);
      setDeleteItem(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast('Failed to delete category', 'error');
    }
  };

  // CRUD Operations for Orders
  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ ...orderForm, updated_at: new Date().toISOString() })
        .eq('id', editingOrder.id);

      if (error) throw error;
      
      showToast('Order updated successfully', 'success');
      setShowOrderModal(false);
      setEditingOrder(null);
      resetOrderForm();
      fetchOrders();
      fetchStats();
    } catch (error) {
      console.error('Error updating order:', error);
      showToast('Failed to update order', 'error');
    }
  };

  // CRUD Operations for Users
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...userForm, updated_at: new Date().toISOString() })
        .eq('id', editingUser.id);

      if (error) throw error;
      
      showToast('User updated successfully', 'success');
      setShowUserModal(false);
      setEditingUser(null);
      resetUserForm();
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('Failed to update user', 'error');
    }
  };

  // Form reset functions
  const resetProductForm = () => {
    setProductForm({
      name: '',
      slug: '',
      description: '',
      price: 0,
      category_id: '',
      stock_quantity: 0,
      image_urls: [''],
      is_active: true,
      featured: false,
      weight: 0,
      dimensions: { length: 0, width: 0, height: 0 }
    });
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      is_active: true
    });
  };

  const resetOrderForm = () => {
    setOrderForm({
      status: 'pending',
      payment_status: 'pending',
      tracking_number: '',
      notes: ''
    });
  };

  const resetUserForm = () => {
    setUserForm({
      full_name: '',
      role: 'user',
      phone: '',
      address: { street: '', city: '', state: '', zip: '', country: '' }
    });
  };

  // Edit handlers
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: product.price,
      category_id: product.category_id || '',
      stock_quantity: product.stock_quantity,
      image_urls: product.image_urls || [''],
      is_active: product.is_active,
      featured: product.featured,
      weight: product.weight || 0,
      dimensions: product.dimensions || { length: 0, width: 0, height: 0 }
    });
    setShowProductModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      is_active: category.is_active
    });
    setShowCategoryModal(true);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setOrderForm({
      status: order.status,
      payment_status: order.payment_status,
      tracking_number: order.tracking_number || '',
      notes: order.notes || ''
    });
    setShowOrderModal(true);
  };

  const handleEditUser = (user: Profile) => {
    setEditingUser(user);
    setUserForm({
      full_name: user.full_name || '',
      role: user.role,
      phone: user.phone || '',
      address: user.address || { street: '', city: '', state: '', zip: '', country: '' }
    });
    setShowUserModal(true);
  };

  // Delete handlers
  const handleDeleteClick = (type: string, id: string, name: string) => {
    setDeleteItem({ type, id, name });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;

    switch (deleteItem.type) {
      case 'product':
        await handleDeleteProduct(deleteItem.id);
        break;
      case 'category':
        await handleDeleteCategory(deleteItem.id);
        break;
      default:
        break;
    }
  };

  // Filter functions
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = !categoryFilter || product.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                         user.email.toLowerCase().includes(userSearch.toLowerCase());
    return matchesSearch;
  });

  // Pagination
  const getPaginatedData = (data: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (dataLength: number) => {
    return Math.ceil(dataLength / itemsPerPage);
  };

  // Load data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  // Update slug when name changes
  useEffect(() => {
    if (productForm.name && !editingProduct) {
      setProductForm(prev => ({ ...prev, slug: generateSlug(prev.name) }));
    }
  }, [productForm.name, editingProduct]);

  useEffect(() => {
    if (categoryForm.name && !editingCategory) {
      setCategoryForm(prev => ({ ...prev, slug: generateSlug(prev.name) }));
    }
  }, [categoryForm.name, editingCategory]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-success text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-800">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-neutral-600">Welcome, {profile?.full_name || user?.email}</span>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-medium">
              {(profile?.full_name || user?.email || '').charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-neutral-200 min-h-screen">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'dashboard'
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5" />
                    <span>Dashboard</span>
                  </div>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'products'
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5" />
                    <span>Products</span>
                  </div>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'categories'
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Filter className="w-5 h-5" />
                    <span>Categories</span>
                  </div>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <ShoppingCart className="w-5 h-5" />
                    <span>Orders</span>
                  </div>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'users'
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5" />
                    <span>Users</span>
                  </div>
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-card shadow-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600">Total Products</p>
                      <p className="text-2xl font-bold text-neutral-800">{stats.totalProducts}</p>
                    </div>
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-card shadow-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600">Total Orders</p>
                      <p className="text-2xl font-bold text-neutral-800">{stats.totalOrders}</p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-card shadow-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600">Total Users</p>
                      <p className="text-2xl font-bold text-neutral-800">{stats.totalUsers}</p>
                    </div>
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-card shadow-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-neutral-800">${stats.totalRevenue.toFixed(2)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-card shadow-card">
                <div className="p-6 border-b border-neutral-200">
                  <h2 className="text-lg font-semibold text-neutral-800">Recent Orders</h2>
                </div>
                <div className="p-6">
                  {stats.recentOrders.length === 0 ? (
                    <p className="text-neutral-600 text-center py-8">No recent orders</p>
                  ) : (
                    <div className="space-y-4">
                      {stats.recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                          <div>
                            <p className="font-medium text-neutral-800">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-neutral-600">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-neutral-800">${order.total_amount.toFixed(2)}</p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'delivered' ? 'bg-success-100 text-success-700' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                              order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-neutral-100 text-neutral-700'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-neutral-800">Products</h2>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    resetProductForm();
                    setShowProductModal(true);
                  }}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Search and Filters */}
              <div className="bg-white p-4 rounded-card shadow-card">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-48">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-card shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Product</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Category</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Price</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Stock</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Status</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedData(filteredProducts).map((product) => {
                        const category = categories.find(c => c.id === product.category_id);
                        return (
                          <tr key={product.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                {product.image_urls?.[0] && (
                                  <img
                                    src={product.image_urls[0]}
                                    alt={product.name}
                                    className="w-12 h-12 object-cover rounded-lg"
                                  />
                                )}
                                <div>
                                  <p className="font-medium text-neutral-800">{product.name}</p>
                                  <p className="text-sm text-neutral-600">{product.slug}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-neutral-700">
                              {category?.name || 'No Category'}
                            </td>
                            <td className="px-6 py-4 text-neutral-700">
                              ${product.price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-neutral-700">
                              {product.stock_quantity}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                product.is_active ? 'bg-success-100 text-success-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {product.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditProduct(product)}
                                  className="p-2 text-primary hover:bg-primary-50 rounded-lg transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick('product', product.id, product.name)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredProducts.length > itemsPerPage && (
                  <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
                    <p className="text-sm text-neutral-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="px-3 py-1 text-sm font-medium text-neutral-700">
                        {currentPage} of {getTotalPages(filteredProducts.length)}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages(filteredProducts.length)))}
                        disabled={currentPage === getTotalPages(filteredProducts.length)}
                        className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-neutral-800">Categories</h2>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    resetCategoryForm();
                    setShowCategoryModal(true);
                  }}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Category</span>
                </button>
              </div>

              {/* Categories Table */}
              <div className="bg-white rounded-card shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Category</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Slug</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Status</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Created</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr key={category.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {category.image_url && (
                                <img
                                  src={category.image_url}
                                  alt={category.name}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                              )}
                              <div>
                                <p className="font-medium text-neutral-800">{category.name}</p>
                                <p className="text-sm text-neutral-600">{category.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-neutral-700">{category.slug}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              category.is_active ? 'bg-success-100 text-success-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {category.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-neutral-700">
                            {new Date(category.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditCategory(category)}
                                className="p-2 text-primary hover:bg-primary-50 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick('category', category.id, category.name)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-neutral-800">Orders</h2>
              </div>

              {/* Search and Filters */}
              <div className="bg-white p-4 rounded-card shadow-card">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Search orders..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-48">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-card shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Order ID</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Customer</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Total</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Status</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Payment</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Date</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedData(filteredOrders).map((order) => {
                        const customer = users.find(u => u.id === order.user_id);
                        return (
                          <tr key={order.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                            <td className="px-6 py-4">
                              <p className="font-medium text-neutral-800">#{order.id.slice(0, 8)}</p>
                            </td>
                            <td className="px-6 py-4 text-neutral-700">
                              {customer?.full_name || customer?.email || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 text-neutral-700">
                              ${order.total_amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'delivered' ? 'bg-success-100 text-success-700' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-neutral-100 text-neutral-700'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                order.payment_status === 'paid' ? 'bg-success-100 text-success-700' :
                                order.payment_status === 'failed' ? 'bg-red-100 text-red-700' :
                                order.payment_status === 'refunded' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-neutral-100 text-neutral-700'
                              }`}>
                                {order.payment_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-neutral-700">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditOrder(order)}
                                  className="p-2 text-primary hover:bg-primary-50 rounded-lg transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredOrders.length > itemsPerPage && (
                  <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
                    <p className="text-sm text-neutral-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="px-3 py-1 text-sm font-medium text-neutral-700">
                        {currentPage} of {getTotalPages(filteredOrders.length)}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages(filteredOrders.length)))}
                        disabled={currentPage === getTotalPages(filteredOrders.length)}
                        className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-neutral-800">Users</h2>
              </div>

              {/* Search */}
              <div className="bg-white p-4 rounded-card shadow-card">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-card shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">User</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Email</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Role</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Phone</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Joined</th>
                        <th className="text-left px-6 py-4 font-medium text-neutral-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedData(filteredUsers).map((user) => (
                        <tr key={user.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {user.avatar_url ? (
                                <img
                                  src={user.avatar_url}
                                  alt={user.full_name || user.email}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                                  {(user.full_name || user.email).charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-neutral-800">{user.full_name || 'No Name'}</p>
                                <p className="text-sm text-neutral-600">ID: {user.id.slice(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-neutral-700">{user.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-700'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-neutral-700">{user.phone || 'Not provided'}</td>
                          <td className="px-6 py-4 text-neutral-700">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-2 text-primary hover:bg-primary-50 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredUsers.length > itemsPerPage && (
                  <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
                    <p className="text-sm text-neutral-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="px-3 py-1 text-sm font-medium text-neutral-700">
                        {currentPage} of {getTotalPages(filteredUsers.length)}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages(filteredUsers.length)))}
                        disabled={currentPage === getTotalPages(filteredUsers.length)}
                        className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-card shadow-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-800">
                  {editingProduct ? 'Edit Product' : 'Add Product'}
                </h3>
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    resetProductForm();
                  }}
                  className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Slug *</label>
                  <input
                    type="text"
                    value={productForm.slug}
                    onChange={(e) => setProductForm(prev => ({ ...prev, slug: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field h-24 resize-none"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stock_quantity}
                    onChange={(e) => setProductForm(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.weight}
                    onChange={(e) => setProductForm(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                    className="input-field"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Category</label>
                <select
                  value={productForm.category_id}
                  onChange={(e) => setProductForm(prev => ({ ...prev, category_id: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Image URLs</label>
                {productForm.image_urls.map((url, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        const newUrls = [...productForm.image_urls];
                        newUrls[index] = e.target.value;
                        setProductForm(prev => ({ ...prev, image_urls: newUrls }));
                      }}
                      className="input-field flex-1"
                      placeholder="https://example.com/image.jpg"
                    />
                    {productForm.image_urls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newUrls = productForm.image_urls.filter((_, i) => i !== index);
                          setProductForm(prev => ({ ...prev, image_urls: newUrls }));
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setProductForm(prev => ({ ...prev, image_urls: [...prev.image_urls, ''] }))}
                  className="btn-secondary text-sm"
                >
                  Add Image URL
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Dimensions (cm)</label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.dimensions.length}
                      onChange={(e) => setProductForm(prev => ({
                        ...prev,
                        dimensions: { ...prev.dimensions, length: parseFloat(e.target.value) || 0 }
                      }))}
                      className="input-field"
                      placeholder="Length"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.dimensions.width}
                      onChange={(e) => setProductForm(prev => ({
                        ...prev,
                        dimensions: { ...prev.dimensions, width: parseFloat(e.target.value) || 0 }
                      }))}
                      className="input-field"
                      placeholder="Width"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.dimensions.height}
                      onChange={(e) => setProductForm(prev => ({
                        ...prev,
                        dimensions: { ...prev.dimensions, height: parseFloat(e.target.value) || 0 }
                      }))}
                      className="input-field"
                      placeholder="Height"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={productForm.is_active}
                    onChange={(e) => setProductForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">Active</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={productForm.featured}
                    onChange={(e) => setProductForm(prev => ({ ...prev, featured: e.target.checked }))}
                    className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">Featured</span>
                </label>
              </div>
              
              <div className="flex items-center justify-end space-x-4 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    resetProductForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-card shadow-card w-full max-w-md">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-800">
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </h3>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                    resetCategoryForm();
                  }}
                  className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Slug *</label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field h-20 resize-none"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Image URL</label>
                <input
                  type="url"
                  value={categoryForm.image_url}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, image_url: e.target.value }))}
                  className="input-field"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={categoryForm.is_active}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">Active</span>
                </label>
              </div>
              
              <div className="flex items-center justify-end space-x-4 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                    resetCategoryForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-card shadow-card w-full max-w-md">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-800">
                  Update Order #{editingOrder.id.slice(0, 8)}
                </h3>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    setEditingOrder(null);
                    resetOrderForm();
                  }}
                  className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleUpdateOrder} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Order Status</label>
                <select
                  value={orderForm.status}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="input-field"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Payment Status</label>
                <select
                  value={orderForm.payment_status}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, payment_status: e.target.value as any }))}
                  className="input-field"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Tracking Number</label>
                <input
                  type="text"
                  value={orderForm.tracking_number}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, tracking_number: e.target.value }))}
                  className="input-field"
                  placeholder="Enter tracking number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Notes</label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="input-field h-20 resize-none"
                  rows={3}
                  placeholder="Add notes about this order"
                />
              </div>
              
              <div className="flex items-center justify-end space-x-4 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowOrderModal(false);
                    setEditingOrder(null);
                    resetOrderForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-card shadow-card w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-800">
                  Edit User
                </h3>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    resetUserForm();
                  }}
                  className="p-2 text-neutral-400 hover:text-neutral-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={userForm.full_name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as 'user' | 'admin' }))}
                  className="input-field"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Address</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={userForm.address.street}
                    onChange={(e) => setUserForm(prev => ({
                      ...prev,
                      address: { ...prev.address, street: e.target.value }
                    }))}
                    className="input-field"
                    placeholder="Street Address"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={userForm.address.city}
                      onChange={(e) => setUserForm(prev => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      className="input-field"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      value={userForm.address.state}
                      onChange={(e) => setUserForm(prev => ({
                        ...prev,
                        address: { ...prev.address, state: e.target.value }
                      }))}
                      className="input-field"
                      placeholder="State"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={userForm.address.zip}
                      onChange={(e) => setUserForm(prev => ({
                        ...prev,
                        address: { ...prev.address, zip: e.target.value }
                      }))}
                      className="input-field"
                      placeholder="ZIP Code"
                    />
                    <input
                      type="text"
                      value={userForm.address.country}
                      onChange={(e) => setUserForm(prev => ({
                        ...prev,
                        address: { ...prev.address, country: e.target.value }
                      }))}
                      className="input-field"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-4 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    resetUserForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-card shadow-card w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800">Confirm Delete</h3>
                  <p className="text-sm text-neutral-600">This action cannot be undone.</p>
                </div>
              </div>
              
              <p className="text-neutral-700 mb-6">
                Are you sure you want to delete <strong>{deleteItem.name}</strong>?
              </p>
              
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteItem(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;