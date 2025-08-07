import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { address, satelliteImage } = await req.json();

    console.log(`Starting roof analysis for address: ${address}`);

    const analysisPrompt = `
You are a professional roof measurement AI. Analyze this property at "${address}" and provide detailed roof measurements.

CRITICAL: Return ONLY valid JSON in this EXACT structure (no extra text, no markdown):
{
  "totalArea": number (in square feet),
  "squares": number (totalArea / 100),
  "confidence": number (0-100),
  "facets": [
    {
      "id": string,
      "area": number,
      "pitch": string (like "6/12", "8/12", etc.),
      "type": "main" | "dormer" | "addition" | "garage",
      "confidence": number
    }
  ],
  "measurements": {
    "ridges": number (linear feet),
    "valleys": number,
    "hips": number,
    "rakes": number,
    "eaves": number,
    "gutters": number,
    "stepFlashing": number,
    "drip": number
  },
  "predominantPitch": string,
  "wasteFactor": number (10-25, typical is 15),
  "areasByPitch": [
    {
      "pitch": string,
      "area": number,
      "squares": number,
      "percentage": number
    }
  ],
  "propertyDetails": {
    "stories": number,
    "estimatedAtticArea": number,
    "structureComplexity": "Simple" | "Moderate" | "Complex" | "Very Complex",
    "roofAccessibility": "Easy" | "Moderate" | "Difficult",
    "chimneys": number,
    "skylights": number,
    "vents": number
  },
  "reportSummary": {
    "totalPerimeter": number,
    "averagePitch": string,
    "roofComplexityScore": number (1-100)
  }
}

Important: 
- Measure carefully, accounting for overhangs (typically 1-3 feet beyond building footprint)
- Consider roof pitch when calculating actual surface area vs footprint
- Count all visible features (chimneys, skylights, vents)
- Estimate complexity based on number of facets, angles, and features
- Provide realistic measurements based on typical residential construction
`;

    let openaiResponse;
    try {
      const openaiRequest = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            {
              role: 'system',
              content: 'You are a professional roof measurement expert. Analyze satellite images and provide precise roof measurements and details in valid JSON format.'
            },
            {
              role: 'user',
              content: satelliteImage ? [
                {
                  type: 'text',
                  text: analysisPrompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: satelliteImage
                  }
                }
              ] : analysisPrompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (!openaiRequest.ok) {
        const errorData = await openaiRequest.json().catch(() => ({}));
        console.error(`❌ OpenAI API error ${openaiRequest.status}:`, errorData);
        
        // DON'T hide the error - return it to the user!
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `OpenAI API error: ${openaiRequest.status}`,
            details: errorData,
            message: errorData.error?.message || 'Unknown OpenAI error',
            openaiStatus: openaiRequest.status,
            timestamp: new Date().toISOString()
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      openaiResponse = await openaiRequest.json();
      console.log('✅ OpenAI analysis completed successfully');
      
    } catch (error) {
      console.error('❌ OpenAI API error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // EXPOSE the real error instead of falling back to mock data
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'OpenAI connection failed',
          details: error.message,
          errorType: error.name,
          timestamp: new Date().toISOString(),
          note: 'Real OpenAI error (not mock data)'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse OpenAI response
    const aiContent = openaiResponse.choices[0].message.content;
    let prediction;
    
    try {
      prediction = JSON.parse(aiContent);
      prediction.squares = prediction.totalArea / 100;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    // Store the analysis in database
    const { data: analysisData, error: dbError } = await supabase
      .from('roof_analyses')
      .insert({
        address,
        coordinates: { lat: 40.7128, lng: -74.0060 }, // Default coordinates, could be enhanced with geocoding
        satellite_image_url: satelliteImage,
        ai_prediction: prediction,
        ai_confidence: prediction.confidence
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to store analysis', details: dbError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Roof analysis completed and stored with ID: ${analysisData.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        prediction,
        analysisId: analysisData.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-roof function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});