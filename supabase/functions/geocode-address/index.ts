import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const mapboxApiKey = Deno.env.get('MAPBOX_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();

    if (!mapboxApiKey) {
      throw new Error('MAPBOX_API_KEY is not configured');
    }

    if (!address || address.trim() === '') {
      throw new Error('Address is required');
    }

    console.log(`Geocoding address: ${address}`);

    // Use Mapbox Geocoding API
    const encodedAddress = encodeURIComponent(address);
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxApiKey}&limit=1`;

    const response = await fetch(geocodeUrl);
    
    if (!response.ok) {
      throw new Error(`Mapbox Geocoding API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error(`No coordinates found for address: ${address}`);
    }

    const feature = data.features[0];
    const [lng, lat] = feature.center;

    console.log(`Successfully geocoded ${address} to ${lat}, ${lng}`);

    return new Response(JSON.stringify({ 
      coordinates: { lat, lng },
      address: feature.place_name,
      confidence: feature.relevance || 1,
      metadata: {
        geocodedAt: new Date().toISOString(),
        originalAddress: address,
        fullFeature: feature
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in geocode-address function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to geocode address'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});