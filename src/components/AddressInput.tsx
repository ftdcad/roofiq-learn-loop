import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Satellite, Loader2 } from 'lucide-react';

interface AddressInputProps {
  onSubmit: (address: string) => void;
  isLoading: boolean;
}

export const AddressInput: React.FC<AddressInputProps> = ({ onSubmit, isLoading }) => {
  const [address, setAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim() && !isLoading) {
      onSubmit(address.trim());
    }
  };

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
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter property address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="pl-10 h-12 bg-input border-border text-foreground"
              disabled={isLoading}
            />
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