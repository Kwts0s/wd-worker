'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ShoppingCart, MapPin, Loader2, CheckCircle2, AlertCircle, Map, Calendar } from 'lucide-react';
import { usePluginSettings } from '@/lib/settings-store';
import { calculateScheduledDropoffTime, hasEnoughTimeForImmediateDelivery, getAvailableDeliveryDates, getAvailableTimeSlots } from '@/lib/schedule-utils';
import { useWoltDriveStore } from '@/store/wolt-store';
import type { AvailableVenue, ShipmentPromiseResponse, DeliveryResponse } from '@/types/wolt-drive';

// Dynamic import for location picker to avoid SSR issues
const LocationPicker = dynamic(() => import('@/components/location-picker').then(mod => ({ default: mod.LocationPicker })), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center">Loading map...</div>
});

interface CartItem {
  product_id: number;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  weight_gram: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { venueSchedule, smsNotifications, customerSupport, shouldSendSmsToDropoffContact, preparationTimeMinutes } = usePluginSettings();
  const { timezone } = useWoltDriveStore();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postCode, setPostCode] = useState('');
  const [latitude, setLatitude] = useState('37.9838');
  const [longitude, setLongitude] = useState('23.7275');
  const [dropoffComment, setDropoffComment] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [useScheduledDelivery, setUseScheduledDelivery] = useState(false);
  const [canDeliverASAP, setCanDeliverASAP] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  
  const [availableVenues, setAvailableVenues] = useState<AvailableVenue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<AvailableVenue | null>(null);
  const [shipmentPromise, setShipmentPromise] = useState<ShipmentPromiseResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState<string>('');

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    // Check if venue has enough time for immediate delivery
    const canDeliverNow = hasEnoughTimeForImmediateDelivery(venueSchedule);
    setCanDeliverASAP(canDeliverNow);
    // Force scheduled delivery if venue is closing soon
    if (!canDeliverNow) {
      setUseScheduledDelivery(true);
    }
  }, [venueSchedule]);

  // Geocode address when it changes
  useEffect(() => {
    const geocodeAddress = async () => {
      if (!street || !city) return;
      
      setGeocoding(true);
      try {
        const searchQuery = `${street}, ${city}${postCode ? ', ' + postCode : ''}`;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=1`,
          {
            headers: {
              'User-Agent': 'WoltDrivePlugin/1.0',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            const result = data[0];
            setLatitude(result.lat);
            setLongitude(result.lon);
          }
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        // Don't show error to user, just keep existing coordinates
      } finally {
        setGeocoding(false);
      }
    };

    const timeoutId = setTimeout(geocodeAddress, 1000); // Debounce for 1 second
    return () => clearTimeout(timeoutId);
  }, [street, city, postCode]);

  const getCartTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleLocationChange = (location: { street: string; city: string; postCode: string; latitude: string; longitude: string }) => {
    setStreet(location.street);
    setCity(location.city);
    setPostCode(location.postCode);
    setLatitude(location.latitude);
    setLongitude(location.longitude);
  };

  const handleAddressBlur = async () => {
    if (!street || !city || !postCode) return;
    
    setLoading(true);
    setError(null);

    try {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      
      let scheduledTimeForApi: string;
      if (useScheduledDelivery && scheduledDate && scheduledTime) {
        // Use customer-selected scheduled time
        scheduledTimeForApi = `${scheduledDate}T${scheduledTime}:00.000Z`;
      } else {
        scheduledTimeForApi = calculateScheduledDropoffTime(venueSchedule, timezone, preparationTimeMinutes);
      }

      const response = await fetch('/api/wolt/available-venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dropoff: {
            location: {
              formatted_address: `${street}, ${city}, ${postCode}`,
              coordinates: { lat, lon }
            }
          },
          scheduled_dropoff_time: scheduledTimeForApi
        })
      });

      if (!response.ok) throw new Error('Failed to fetch available venues');

      const venues = await response.json();
      setAvailableVenues(venues);
      
      // Auto-select first venue and get promise
      if (venues.length > 0) {
        await handleVenueSelect(venues[0], lat, lon);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  const handleVenueSelect = async (venue: AvailableVenue, lat: number, lon: number) => {
    setSelectedVenue(venue);
    setLoading(true);
    
    try {
      let scheduledTimeToUse: string;
      if (useScheduledDelivery && scheduledDate && scheduledTime) {
        scheduledTimeToUse = `${scheduledDate}T${scheduledTime}:00.000Z`;
      } else {
        scheduledTimeToUse = calculateScheduledDropoffTime(venueSchedule, timezone, preparationTimeMinutes);
      }
      
      const response = await fetch('/api/wolt/shipment-promises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue_id: venue.pickup.venue_id,
          street,
          city,
          post_code: postCode,
          lat,
          lon,
          language: 'en',
          min_preparation_time_minutes: preparationTimeMinutes,
          scheduled_dropoff_time: scheduledTimeToUse
        })
      });

      if (!response.ok) throw new Error('Failed to get shipment promise');

      const promise = await response.json();
      setShipmentPromise(promise);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get delivery estimate');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedVenue || !shipmentPromise) {
      setError('Missing venue or shipment promise');
      return;
    }

    if (useScheduledDelivery && (!scheduledDate || !scheduledTime)) {
      setError('Please select a delivery date and time');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const orderNumber = `ORDER-${Date.now()}`;
      
      let scheduledTimeToUse: string;
      if (useScheduledDelivery && scheduledDate && scheduledTime) {
        scheduledTimeToUse = `${scheduledDate}T${scheduledTime}:00.000Z`;
      } else {
        scheduledTimeToUse = calculateScheduledDropoffTime(venueSchedule, timezone, preparationTimeMinutes);
      }

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
              min_preparation_time_minutes: 10,
              scheduled_time: scheduledTimeToUse
            },
            comment: 'E-shop order'
          },
          dropoff: {
            location: {
              coordinates: { lat, lon }
            },
            comment: dropoffComment || 'Please ring the doorbell',
            options: {
              is_no_contact: false,
              scheduled_time: scheduledTimeToUse
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
          customer_support: customerSupport,
          merchant_order_reference_id: orderNumber,
          order_number: orderNumber,
          sms_notifications: {
            received: smsNotifications.received
              .replace('{CUSTOMER_NAME}', customerName)
              .replace('{STORE_NAME}', 'E-Shop')
              .replace('{TRACKING_LINK}', 'TRACKING_LINK'),
            picked_up: smsNotifications.picked_up
              .replace('{CUSTOMER_NAME}', customerName)
              .replace('{STORE_NAME}', 'E-Shop')
              .replace('{TRACKING_LINK}', 'TRACKING_LINK'),
          },
          handshake_delivery: {
            is_required: false,
            should_send_sms_to_dropoff_contact: shouldSendSmsToDropoffContact
          }
        })
      });

      if (!response.ok) throw new Error('Failed to create delivery');

      const deliveryData: DeliveryResponse = await response.json();
      setTrackingUrl(deliveryData.tracking?.url || '');
      setSuccess(true);
      localStorage.removeItem('cart');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create delivery');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
          <p className="text-gray-600 mb-6">Your order has been successfully placed and a Wolt driver will pick it up soon.</p>
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline mb-6 block"
            >
              Track your delivery →
            </a>
          )}
          <div className="space-y-2">
            <Button onClick={() => router.push('/cart')} className="w-full">
              Continue Shopping
            </Button>
            <Button onClick={() => router.push('/admin/deliveries')} variant="outline" className="w-full">
              View in Admin
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            </div>
            <Button variant="outline" onClick={() => router.push('/cart')}>
              Back to Cart
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Customer Information */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="John Doe" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+30 210 1234567" required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <Input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="john@example.com" required />
              </div>
            </div>
          </Card>

          {/* Delivery Address */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Address
              {geocoding && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Updating location...
                </span>
              )}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                <Input value={street} onChange={e => setStreet(e.target.value)} onBlur={handleAddressBlur} placeholder="123 Main St" required />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <Input value={city} onChange={e => setCity(e.target.value)} onBlur={handleAddressBlur} placeholder="Athens" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Post Code *</label>
                  <Input value={postCode} onChange={e => setPostCode(e.target.value)} onBlur={handleAddressBlur} placeholder="10431" required />
                </div>
              </div>
              
              {/* Current Coordinates Display */}
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span>Current coordinates: {latitude}, {longitude}</span>
              </div>
              
              {/* Show Map Button */}
              <div className="pt-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setShowMap(!showMap)}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Map className="h-4 w-4" />
                  {showMap ? 'Hide Map' : 'Show Map - Select Precise Location'}
                </Button>
              </div>

              {/* Map Picker */}
              {showMap && (
                <div className="mt-4">
                  <LocationPicker
                    street={street}
                    city={city}
                    postCode={postCode}
                    latitude={latitude}
                    longitude={longitude}
                    onLocationChange={handleLocationChange}
                  />
                </div>
              )}

              {/* Dropoff Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Instructions (Optional)</label>
                <Input 
                  value={dropoffComment} 
                  onChange={e => setDropoffComment(e.target.value)} 
                  placeholder="e.g., Please ring the doorbell, Leave at door" 
                />
                <p className="text-xs text-gray-500 mt-1">Add any special instructions for the delivery driver</p>
              </div>
            </div>
          </Card>

          {/* Delivery Time Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Time</h2>
            
            {/* Warning if venue is closed or closing soon */}
            {!canDeliverASAP && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium text-orange-900 mb-1">Venue Closing Soon</p>
                  <p>
                    The venue will close soon and cannot fulfill immediate delivery orders. 
                    Please schedule your delivery for a later time.
                  </p>
                </div>
              </div>
            )}

            {/* ASAP vs Scheduled Toggle */}
            {canDeliverASAP ? (
              <div className="space-y-4">
                {/* ASAP Delivery Option */}
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    id="asap-delivery"
                    name="delivery-type"
                    checked={!useScheduledDelivery}
                    onChange={() => setUseScheduledDelivery(false)}
                    className="mt-1 h-4 w-4 text-blue-600"
                  />
                  <label htmlFor="asap-delivery" className="flex-1 cursor-pointer">
                    <div className="font-medium text-gray-900">ASAP Delivery</div>
                    <p className="text-sm text-gray-600">
                      Delivery within approximately {preparationTimeMinutes} minutes (venue hours: {venueSchedule.openTime} - {venueSchedule.closeTime})
                    </p>
                  </label>
                </div>

                {/* Scheduled Delivery Option */}
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    id="scheduled-delivery"
                    name="delivery-type"
                    checked={useScheduledDelivery}
                    onChange={() => setUseScheduledDelivery(true)}
                    className="mt-1 h-4 w-4 text-blue-600"
                  />
                  <label htmlFor="scheduled-delivery" className="flex-1 cursor-pointer">
                    <div className="font-medium text-gray-900">Schedule Delivery</div>
                    <p className="text-sm text-gray-600">
                      Choose a specific date and time for delivery
                    </p>
                  </label>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-700 mb-4">
                <p className="font-medium">Scheduled Delivery Required</p>
                <p>Select a date and time when the venue will be open.</p>
              </div>
            )}

            {/* Scheduled Delivery Selection */}
            {useScheduledDelivery && (
              <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Select Delivery Date *
                  </label>
                  <select
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose a date</option>
                    {getAvailableDeliveryDates().map((date: { value: string; label: string }) => (
                      <option key={date.value} value={date.value}>
                        {date.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Delivery Time *
                  </label>
                  <select
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!scheduledDate}
                  >
                    <option value="">Choose a time</option>
                    {getAvailableTimeSlots(venueSchedule).map((slot: { value: string; label: string }) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Venue hours: {venueSchedule.openTime} - {venueSchedule.closeTime}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Venue & Delivery Estimate */}
          {availableVenues.length > 0 && selectedVenue && shipmentPromise && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3">Delivery Estimate</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Pickup Location:</span>
                  <span className="font-medium">{selectedVenue.pickup.name[0]?.value}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Delivery Fee:</span>
                  <span className="font-semibold text-blue-600">€{((shipmentPromise.fee?.amount || 0) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Estimated Time:</span>
                  <span className="font-medium">{selectedVenue.pre_estimate.total_minutes.mean} minutes</span>
                </div>
              </div>
            </Card>
          )}

          {/* Order Summary */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              {cart.map(item => (
                <div key={item.product_id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.name} x{item.quantity}</span>
                  <span className="font-medium">€{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Subtotal</span>
                <span className="font-semibold">€{getCartTotal().toFixed(2)}</span>
              </div>
              {shipmentPromise && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Delivery Fee</span>
                  <span className="font-semibold">€{((shipmentPromise.fee?.amount || 0) / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-blue-600">
                  €{(getCartTotal() + ((shipmentPromise?.fee?.amount || 0) / 100)).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <Button
            onClick={handlePlaceOrder}
            disabled={loading || !selectedVenue || !shipmentPromise || !customerName || !customerPhone || !customerEmail}
            className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Place Order & Pay'
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
