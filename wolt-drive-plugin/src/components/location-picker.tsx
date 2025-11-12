'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search, Loader2 } from 'lucide-react';

// Dynamic import to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('./map-component'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

interface LocationPickerProps {
  street: string;
  city: string;
  postCode: string;
  latitude: string;
  longitude: string;
  onLocationChange: (location: {
    street: string;
    city: string;
    postCode: string;
    latitude: string;
    longitude: string;
  }) => void;
}

interface GeocodingResult {
  lat: number;
  lon: number;
  display_name: string;
  address?: {
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
    suburb?: string;
    neighbourhood?: string;
  };
}

export function LocationPicker({
  street,
  city,
  postCode,
  latitude,
  longitude,
  onLocationChange,
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Handle map click - reverse geocode the coordinates
  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      setIsReverseGeocoding(true);
      try {
        // Use Nominatim for reverse geocoding (free, no API key required)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'WoltDrivePlugin/1.0',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Reverse geocoding failed');
        }

        const data: GeocodingResult = await response.json();

        // Extract address components
        const roadName = data.address?.road || data.address?.neighbourhood || '';
        const cityName =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.suburb ||
          '';
        const postalCode = data.address?.postcode || '';

        onLocationChange({
          street: roadName,
          city: cityName,
          postCode: postalCode,
          latitude: lat.toString(),
          longitude: lng.toString(),
        });
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        // Still update coordinates even if address lookup fails
        onLocationChange({
          street,
          city,
          postCode,
          latitude: lat.toString(),
          longitude: lng.toString(),
        });
      } finally {
        setIsReverseGeocoding(false);
      }
    },
    [street, city, postCode, onLocationChange]
  );

  // Handle search - forward geocode the search query
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Use Nominatim for forward geocoding (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&addressdetails=1&limit=1`,
        {
          headers: {
            'User-Agent': 'WoltDrivePlugin/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data: GeocodingResult[] = await response.json();

      if (data.length > 0) {
        const result = data[0];
        const roadName = result.address?.road || result.address?.neighbourhood || '';
        const cityName =
          result.address?.city ||
          result.address?.town ||
          result.address?.village ||
          result.address?.suburb ||
          '';
        const postalCode = result.address?.postcode || '';

        onLocationChange({
          street: roadName,
          city: cityName,
          postCode: postalCode,
          latitude: result.lat.toString(),
          longitude: result.lon.toString(),
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Failed to find location. Please try a different search query.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Picker
        </CardTitle>
        <CardDescription>
          Search for a location or click on the map to select coordinates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <Input
            placeholder="Search for a place (e.g., 'Mesogeion 217, Athens')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="flex items-center gap-2"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search
          </Button>
        </div>

        {/* Map */}
        <div className="relative">
          {isReverseGeocoding && (
            <div className="absolute top-2 right-2 z-[1000] bg-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Getting address...</span>
            </div>
          )}
          <MapComponent
            center={[parseFloat(latitude) || 37.9838, parseFloat(longitude) || 23.7275]}
            zoom={13}
            onLocationSelect={handleMapClick}
          />
        </div>

        {/* Current Coordinates Display */}
        <div className="bg-muted p-3 rounded-lg space-y-2">
          <div className="text-sm font-medium">Selected Location:</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Latitude:</span>{' '}
              <span className="font-mono">{latitude || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Longitude:</span>{' '}
              <span className="font-mono">{longitude || 'N/A'}</span>
            </div>
          </div>
          {street && (
            <div className="text-sm">
              <span className="text-muted-foreground">Address:</span> {street}
              {city && `, ${city}`}
              {postCode && ` ${postCode}`}
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          💡 Tip: Click anywhere on the map to automatically get the address and coordinates
        </div>
      </CardContent>
    </Card>
  );
}
