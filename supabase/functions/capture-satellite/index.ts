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
    const { address, coordinates, zoom = 20, size = '1024x1024', retina = true, bearing = 0, style = 'mapbox/satellite-v9' } = await req.json();

    if (!mapboxApiKey) {
      throw new Error('MAPBOX_API_KEY is not configured');
    }

    console.log(`Capturing satellite image for: ${address} at zoom ${zoom}`);

    // Construct Mapbox Static Images API URL
    const retinaParam = retina ? '@2x' : '';
    const mapboxUrl = `https://api.mapbox.com/styles/v1/${style}/static/${coordinates.lng},${coordinates.lat},${zoom},${bearing}/${size}${retinaParam}?access_token=${mapboxApiKey}`;

    // Fetch the satellite image
    const imageResponse = await fetch(mapboxUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Mapbox API error: ${imageResponse.status} ${imageResponse.statusText}`);
    }

    // Get image as blob
    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();

    // Convert to base64 for easy handling
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const dataUrl = `data:image/png;base64,${base64Image}`;

    console.log(`Successfully captured ${imageBuffer.byteLength} bytes satellite image`);

    return new Response(JSON.stringify({ 
      imageUrl: dataUrl,
      coordinates,
      metadata: {
        zoom,
        size,
        bearing,
        style,
        capturedAt: new Date().toISOString(),
        sizeBytes: imageBuffer.byteLength
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in capture-satellite function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to capture satellite image'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});