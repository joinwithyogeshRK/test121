import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Share2, Minus, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import ReviewCard from '../components/ReviewCard';
import { supabase } from '../lib/supabase';
import { Product, Review } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (productError) throw productError;
      
      if (!productData) {
        navigate('/products');
        return;
      }

      setProduct(productData);

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            full_name
          )
        `)
        .eq('product_id', productData.id)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
      } else {
        const reviewsWithUser = reviewsData?.map(review => ({
          ...review,
          user: review.profiles ? { full_name: review.profiles.full_name } : null
        })) || [];
        setReviews(reviewsWithUser);
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    
    if (!product) return;
    
    await addToCart(product.id, quantity);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
            <div className="space-y-4">
              <div className="bg-neutral-200 h-96 rounded-lg"></div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-neutral-200 h-20 rounded"></div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-neutral-200 h-8 w-3/4 rounded"></div>
              <div className="bg-neutral-200 h-6 w-1/2 rounded"></div>
              <div className="bg-neutral-200 h-12 w-1/3 rounded"></div>
              <div className="bg-neutral-200 h-24 w-full rounded"></div>
              <div className="bg-neutral-200 h-12 w-full rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const images = product.image_urls && product.image_urls.length > 0 
    ? product.image_urls 
    : ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=600&fit=crop'];

  const averageRating = calculateAverageRating();

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8">
        {/* Breadcrumb */}
        <nav className="breadcrumb mb-8">
          <a href="/" className="hover:text-primary">Home</a>
          <span className="breadcrumb-separator">/</span>
          <a href="/products" className="hover:text-primary">Products</a>
          <span className="breadcrumb-separator">/</span>
          <span className="text-neutral-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=600&fit=crop';
                }}
              />
              {product.featured && (
                <Badge className="absolute top-4 left-4 bg-success hover:bg-success">
                  Featured
                </Badge>
              )}
              {product.stock_quantity === 0 && (
                <Badge className="absolute top-4 right-4 bg-red-500 hover:bg-red-600">
                  Out of Stock
                </Badge>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`border-2 rounded-lg overflow-hidden ${
                      selectedImage === index ? 'border-primary' : 'border-neutral-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                {product.name}
              </h1>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(averageRating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-neutral-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-neutral-600 ml-2">
                    ({reviews.length} reviews)
                  </span>
                </div>
              </div>
              
              <div className="text-3xl font-bold text-neutral-900 mb-4">
                {formatPrice(product.price)}
              </div>
            </div>

            {product.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-neutral-700 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-neutral-700">
                  Quantity:
                </label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity === 0}
                  className="flex-1 bg-success hover:bg-success-600 text-white"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
                
                <Button variant="outline" size="lg">
                  <Heart className="h-5 w-5" />
                </Button>
                
                <Button variant="outline" size="lg">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Stock:</span>
                  <span className={product.stock_quantity > 0 ? 'text-success' : 'text-red-600'}>
                    {product.stock_quantity > 0 ? `${product.stock_quantity} available` : 'Out of stock'}
                  </span>
                </div>
                {product.weight && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Weight:</span>
                    <span>{product.weight} lbs</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="reviews" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="reviews" className="mt-8">
              <div className="space-y-6">
                {reviews.length > 0 ? (
                  <div className="grid gap-6">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-neutral-600">No reviews yet. Be the first to review this product!</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="specifications" className="mt-8">
              <div className="bg-white rounded-lg border border-neutral-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-3">Product Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Price:</span>
                        <span>{formatPrice(product.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Stock Quantity:</span>
                        <span>{product.stock_quantity}</span>
                      </div>
                      {product.weight && (
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Weight:</span>
                          <span>{product.weight} lbs</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {product.dimensions && (
                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-3">Dimensions</h4>
                      <div className="space-y-2 text-sm">
                        {product.dimensions.length && (
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Length:</span>
                            <span>{product.dimensions.length} inches</span>
                          </div>
                        )}
                        {product.dimensions.width && (
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Width:</span>
                            <span>{product.dimensions.width} inches</span>
                          </div>
                        )}
                        {product.dimensions.height && (
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Height:</span>
                            <span>{product.dimensions.height} inches</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;