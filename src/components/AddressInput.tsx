import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Satellite, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AddressInputProps {
  onSubmit: (address: string) => void;
  isLoading: boolean;
}

interface GeocodeResult {
  place_name: string;
  center: [number, number];
}

export const AddressInput: React.FC<AddressInputProps> = ({ onSubmit, isLoading }) => {
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { 
          address: query,
          autocomplete: true,
          limit: 5
        }
      });

      if (error) throw error;
      
      setSuggestions(data.features || []);
    } catch (error) {
      console.error('Geocoding error:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    setShowSuggestions(true);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchAddresses(value);
    }, 300);
  };

  const selectSuggestion = (suggestion: GeocodeResult) => {
    setAddress(suggestion.place_name);
    setSuggestions([]);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim() && !isLoading) {
      setShowSuggestions(false);
      onSubmit(address.trim());
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Card className="roofiq-card">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-roofiq-blue/10">
            <Satellite className="w-6 h-6 text-roofiq-blue" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Roof Analysis</h2>
            <p className="text-sm text-muted-foreground">
              Enter an address to capture satellite imagery and predict roof measurements
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Enter property address..."
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-10 h-12 bg-input border-border text-foreground"
              disabled={isLoading}
              autoComplete="off"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
            
            {/* Address Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3 border-b border-border last:border-b-0"
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground">{suggestion.place_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <Button
            type="submit"
            className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-opacity"
            disabled={!address.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Roof...
              </>
            ) : (
              <>
                <Satellite className="w-5 h-5 mr-2" />
                Analyze Roof
              </>
            )}
          </Button>
        </form>
        
        <div className="mt-4 text-xs text-muted-foreground">
          AI will capture satellite imagery and predict facets, area, and measurements
        </div>
      </div>
    </Card>
  );
};