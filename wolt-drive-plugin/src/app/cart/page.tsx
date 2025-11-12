'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShoppingCart, Trash2, Plus, Minus, Truck, Package, Store } from 'lucide-react';

interface Product {
  product_id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  weight_gram: number;
  category: string;
  image_url: string;
}

interface CartItem extends Product {
  quantity: number;
}

type DeliveryMethod = 'pickup' | 'acs' | 'wolt';

export default function CartPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('wolt');

  // Load products
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data.products || []))
      .catch(err => console.error('Failed to load products:', err));

    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.product_id === product.product_id);
      if (existing) {
        return prevCart.map(item =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product_id === productId) {
          const newQuantity = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.product_id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getTotalWeight = () => {
    return cart.reduce((sum, item) => sum + item.weight_gram * item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }
    
    // Save delivery method to localStorage for checkout page
    localStorage.setItem('deliveryMethod', deliveryMethod);
    
    if (deliveryMethod === 'wolt') {
      router.push('/checkout');
    } else {
      // For pickup and ACS, show simple success
      alert(`Order placed with ${deliveryMethod === 'pickup' ? 'Pickup' : 'ACS Courier'}!`);
      setCart([]);
    }
  };

  const deliveryMethodInfo = {
    pickup: { label: 'Pickup from Store', fee: 'Free', icon: Store, description: 'Available today' },
    acs: { label: 'ACS Courier', fee: '€3.50', icon: Truck, description: '2-3 business days' },
    wolt: { label: 'Wolt Drive', fee: 'Calculated', icon: Truck, description: 'Same day delivery' },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">E-Shop</h1>
                <p className="text-sm text-gray-500">Premium Electronics Store</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.push('/')}>
              Admin Panel
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Products</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {products.map(product => (
                <Card key={product.product_id} className="p-5 hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">€{product.price.toFixed(2)}</span>
                    <Button onClick={() => addToCart(product)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">In stock: {product.stock_quantity}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart & Checkout Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Cart Summary */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Shopping Cart</h2>
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Your cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.product_id} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                            <p className="text-sm text-gray-600">€{item.price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.product_id, -1)}
                              className="h-7 w-7 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.product_id, 1)}
                              className="h-7 w-7 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.product_id)}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold">€{getCartTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Weight</span>
                        <span className="text-gray-600">{getTotalWeight()}g</span>
                      </div>
                    </div>
                  </>
                )}
              </Card>

              {/* Delivery Method Selection */}
              {cart.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Delivery Method</h3>
                  <div className="space-y-3">
                    {Object.entries(deliveryMethodInfo).map(([key, info]) => {
                      const Icon = info.icon;
                      const isSelected = deliveryMethod === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setDeliveryMethod(key as DeliveryMethod)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                  {info.label}
                                </span>
                                <span className={`text-sm font-semibold ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                                  {info.fee}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-0.5">{info.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Checkout Button */}
              {cart.length > 0 && (
                <Button 
                  onClick={handleCheckout}
                  className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                >
                  {deliveryMethod === 'wolt' ? 'Continue to Checkout' : 'Place Order'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">About Us</h3>
              <p className="text-sm text-gray-600">Premium electronics store with fast delivery options.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Contact</h3>
              <p className="text-sm text-gray-600">Email: support@example.com</p>
              <p className="text-sm text-gray-600">Phone: +30 210 1234567</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Delivery</h3>
              <p className="text-sm text-gray-600">Fast delivery with Wolt Drive</p>
              <p className="text-sm text-gray-600">Same day delivery available</p>
            </div>
          </div>
          <div className="border-t mt-8 pt-6 text-center text-sm text-gray-500">
            <p>© 2024 E-Shop. Powered by Wolt Drive.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
