'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Trash2, Plus, Minus, Truck, Package, MapPin } from 'lucide-react';
import { AvailableVenue, ShipmentPromiseResponse, DeliveryResponse } from '@/types/wolt-drive';

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

type CheckoutStep = 'cart' | 'delivery-method' | 'address' | 'venue-selection' | 'confirm' | 'success';
type DeliveryMethod = 'pickup' | 'acs' | 'wolt';

export default function CartPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
  
  // Address form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postCode, setPostCode] = useState('');
  const [lat] = useState<number | null>(null);
  const [lon] = useState<number | null>(null);

  // Wolt Drive flow
  const [availableVenues, setAvailableVenues] = useState<AvailableVenue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<AvailableVenue | null>(null);
  const [shipmentPromise, setShipmentPromise] = useState<ShipmentPromiseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryResponse, setDeliveryResponse] = useState<DeliveryResponse | null>(null);

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
    setStep('delivery-method');
  };

  const handleDeliveryMethodSelect = (method: DeliveryMethod) => {
    setDeliveryMethod(method);
    if (method === 'wolt') {
      setStep('address');
    } else {
      // For pickup and ACS, go directly to success
      setStep('success');
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // For demo purposes, use a default location if lat/lon not provided
      const useLat = lat || 37.9838;
      const useLon = lon || 23.7275;

      const response = await fetch('/api/wolt/available-venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dropoff: {
            location: {
              formatted_address: `${street}, ${city}, ${postCode}`,
              coordinates: { lat: useLat, lon: useLon }
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch available venues');
      }

      const data = await response.json();
      setAvailableVenues(data);
      setStep('venue-selection');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch venues');
    } finally {
      setLoading(false);
    }
  };

  const handleVenueSelect = async (venue: AvailableVenue) => {
    setSelectedVenue(venue);
    setLoading(true);
    setError(null);

    try {
      const useLat = lat || 37.9838;
      const useLon = lon || 23.7275;

      const response = await fetch('/api/wolt/shipment-promises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue_id: venue.pickup.venue_id,
          street,
          city,
          post_code: postCode,
          lat: useLat,
          lon: useLon,
          language: 'en',
          min_preparation_time_minutes: 10
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get shipment promise');
      }

      const data = await response.json();
      setShipmentPromise(data);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get shipment promise');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedVenue || !shipmentPromise) {
      setError('Missing venue or shipment promise');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const useLat = lat || 37.9838;
      const useLon = lon || 23.7275;
      const orderNumber = `ORDER-${Date.now()}`;

      const parcels = cart.map(item => ({
        count: item.quantity,
        dimensions: {
          weight_gram: item.weight_gram,
          width_cm: 20,
          height_cm: 10,
          depth_cm: 15
        },
        price: {
          amount: Math.round(item.price * 100),
          currency: 'EUR'
        },
        description: item.name,
        identifier: item.sku,
        dropoff_restrictions: {
          id_check_required: false
        }
      }));

      const response = await fetch('/api/wolt/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue_id: selectedVenue.pickup.venue_id,
          pickup: {
            options: {
              min_preparation_time_minutes: 10
            },
            comment: 'E-shop order'
          },
          dropoff: {
            location: {
              coordinates: { lat: useLat, lon: useLon }
            },
            comment: 'Please ring the doorbell',
            options: {
              is_no_contact: false
            }
          },
          price: {
            amount: Math.round(getCartTotal() * 100),
            currency: 'EUR'
          },
          recipient: {
            name: customerName,
            phone_number: customerPhone,
            email: customerEmail
          },
          parcels,
          shipment_promise_id: shipmentPromise.id,
          customer_support: {
            email: 'support@example.com',
            phone_number: '+30 210 1234567',
            url: 'https://example.com/support'
          },
          merchant_order_reference_id: orderNumber,
          order_number: orderNumber
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create delivery');
      }

      const deliveryData = await response.json();
      setDeliveryResponse(deliveryData);
      setCart([]); // Clear cart
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create delivery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-20">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">E-Shop</h1>
            </div>
            <Button variant="outline" onClick={() => router.push('/')}>
              Admin Panel
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Step: Cart View */}
          {step === 'cart' && (
            <div className="grid md:grid-cols-3 gap-8">
              {/* Products */}
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold mb-6">Products</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {products.map(product => (
                    <Card key={product.product_id} className="p-4">
                      <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">€{product.price.toFixed(2)}</span>
                        <Button onClick={() => addToCart(product)} size="sm">
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Cart Summary */}
              <div>
                <Card className="p-6 sticky top-24">
                  <h2 className="text-xl font-bold mb-4">Shopping Cart</h2>
                  {cart.length === 0 ? (
                    <p className="text-muted-foreground">Your cart is empty</p>
                  ) : (
                    <>
                      <div className="space-y-3 mb-6">
                        {cart.map(item => (
                          <div key={item.product_id} className="flex items-center justify-between text-sm">
                            <div className="flex-1">
                              <div className="font-medium">{item.name}</div>
                              <div className="text-muted-foreground">€{item.price.toFixed(2)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.product_id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.product_id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFromCart(item.product_id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-4 mb-4">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span>€{getCartTotal().toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Weight: {getTotalWeight()}g
                        </div>
                      </div>
                      <Button onClick={handleCheckout} className="w-full" size="lg">
                        Proceed to Checkout
                      </Button>
                    </>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* Step: Delivery Method Selection */}
          {step === 'delivery-method' && (
            <Card className="max-w-2xl mx-auto p-8">
              <h2 className="text-2xl font-bold mb-6">Select Delivery Method</h2>
              <div className="grid gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-6 justify-start text-left"
                  onClick={() => handleDeliveryMethodSelect('pickup')}
                >
                  <Package className="h-8 w-8 mr-4" />
                  <div>
                    <div className="font-semibold">Pickup from Store</div>
                    <div className="text-sm text-muted-foreground">Free - Available today</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-6 justify-start text-left"
                  onClick={() => handleDeliveryMethodSelect('acs')}
                >
                  <Truck className="h-8 w-8 mr-4" />
                  <div>
                    <div className="font-semibold">ACS Courier</div>
                    <div className="text-sm text-muted-foreground">€3.50 - 2-3 business days</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-6 justify-start text-left border-primary"
                  onClick={() => handleDeliveryMethodSelect('wolt')}
                >
                  <Truck className="h-8 w-8 mr-4 text-primary" />
                  <div>
                    <div className="font-semibold">Wolt Drive</div>
                    <div className="text-sm text-muted-foreground">Express delivery - Same day</div>
                  </div>
                </Button>
              </div>
              <Button variant="ghost" onClick={() => setStep('cart')} className="mt-4">
                Back to Cart
              </Button>
            </Card>
          )}

          {/* Step: Address Form */}
          {step === 'address' && (
            <Card className="max-w-2xl mx-auto p-8">
              <h2 className="text-2xl font-bold mb-6">Delivery Address</h2>
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <Input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <Input
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    required
                    placeholder="+30 210 1234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    required
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Street Address</label>
                  <Input
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    required
                    placeholder="123 Main St"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <Input
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      required
                      placeholder="Athens"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Post Code</label>
                    <Input
                      value={postCode}
                      onChange={e => setPostCode(e.target.value)}
                      required
                      placeholder="10431"
                    />
                  </div>
                </div>
                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setStep('delivery-method')}>
                    Back
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Loading...' : 'Find Available Venues'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Step: Venue Selection */}
          {step === 'venue-selection' && (
            <Card className="max-w-2xl mx-auto p-8">
              <h2 className="text-2xl font-bold mb-6">Select Pickup Venue</h2>
              <div className="space-y-4">
                {availableVenues.map((venue, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="h-auto py-4 justify-start text-left w-full"
                    onClick={() => handleVenueSelect(venue)}
                    disabled={loading}
                  >
                    <MapPin className="h-6 w-6 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold">
                        {venue.pickup.name.find(n => n.lang === 'en')?.value || venue.pickup.name[0]?.value}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {venue.pickup.location.formatted_address}
                      </div>
                      <div className="text-sm mt-1">
                        Fee: €{(venue.fee.amount / 100).toFixed(2)} • ETA: {venue.pre_estimate.total_minutes.mean} min
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm mt-4">
                  {error}
                </div>
              )}
              <Button variant="ghost" onClick={() => setStep('address')} className="mt-4">
                Back
              </Button>
            </Card>
          )}

          {/* Step: Confirm Order */}
          {step === 'confirm' && selectedVenue && shipmentPromise && (
            <Card className="max-w-2xl mx-auto p-8">
              <h2 className="text-2xl font-bold mb-6">Confirm Your Order</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <div className="text-sm text-muted-foreground">Order Total</div>
                  <div className="text-2xl font-bold">€{getCartTotal().toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Delivery Fee</div>
                  <div className="text-xl font-semibold">
                    €{((shipmentPromise.fee?.amount || 0) / 100).toFixed(2)}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                  <div className="text-2xl font-bold">
                    €{(getCartTotal() + (shipmentPromise.fee?.amount || 0) / 100).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Estimated Delivery</div>
                  <div>{shipmentPromise.estimated_delivery_time || 'TBD'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Delivery To</div>
                  <div>{customerName}</div>
                  <div className="text-sm">{street}, {city}, {postCode}</div>
                  <div className="text-sm">{customerPhone}</div>
                </div>
              </div>
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setStep('venue-selection')}>
                  Back
                </Button>
                <Button onClick={handleConfirmOrder} disabled={loading} className="flex-1">
                  {loading ? 'Creating Order...' : 'Confirm & Pay'}
                </Button>
              </div>
            </Card>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <Card className="max-w-2xl mx-auto p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-3xl">✓</div>
              </div>
              <h2 className="text-2xl font-bold mb-4">Order Successful!</h2>
              {deliveryMethod === 'wolt' && deliveryResponse ? (
                <>
                  <p className="text-muted-foreground mb-6">
                    Your order has been placed and a Wolt driver will pick it up soon.
                  </p>
                  <div className="bg-muted p-4 rounded-lg mb-6 text-left">
                    <div className="text-sm text-muted-foreground mb-1">Tracking Number</div>
                    <div className="font-mono font-semibold mb-3">
                      {deliveryResponse.wolt_order_reference_id}
                    </div>
                    {deliveryResponse.tracking?.url && (
                      <a
                        href={deliveryResponse.tracking.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        Track your delivery →
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground mb-6">
                  Your order has been placed successfully!
                </p>
              )}
              <div className="flex gap-3 justify-center">
                <Button onClick={() => {
                  setStep('cart');
                  setDeliveryMethod(null);
                  setSelectedVenue(null);
                  setShipmentPromise(null);
                  setDeliveryResponse(null);
                }}>
                  Continue Shopping
                </Button>
                <Button variant="outline" onClick={() => router.push('/')}>
                  View Admin Panel
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
