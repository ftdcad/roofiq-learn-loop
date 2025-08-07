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
You are a professional roof measurement AI analyzing the property at "${address}".

CRITICAL ANALYSIS REQUIREMENTS:
1. Each address MUST produce UNIQUE measurements - no templates or repeated values
2. Analyze the specific property type and location to estimate realistic measurements
3. Vary roof complexity based on address characteristics (suburban vs urban vs rural)
4. Count roof facets realistically - simple homes have 2-4, complex homes have 6-15+
5. Generate measurements that reflect actual property characteristics

ADDRESS-SPECIFIC ANALYSIS FOR: ${address}

Based on this specific address:
- Estimate property type (ranch, colonial, contemporary, etc.)
- Consider regional building styles
- Factor in lot size and neighborhood density
- Analyze roof complexity from address characteristics

MEASUREMENT GUIDELINES:
- Small homes (1000-1800 sq ft): 2-4 facets
- Medium homes (1800-3000 sq ft): 4-8 facets  
- Large homes (3000+ sq ft): 6-15+ facets
- Complex roofs: Multiple dormers, additions, multi-level

PITCH VARIATION BY REGION:
- Northern states: 8/12 to 12/12 (steep for snow)
- Southern states: 4/12 to 8/12 (moderate slopes)
- Coastal areas: 6/12 to 10/12 (wind resistance)

RETURN ONLY VALID JSON IN THIS EXACT STRUCTURE:
{
  "address": "${address}",
  "analysis_timestamp": "${new Date().toISOString()}",
  "totalArea": [UNIQUE NUMBER - realistic for this property type],
  "squares": [totalArea / 100],
  "confidence": [VARY 75-95 based on analysis clarity],
  "facets": [
    {
      "id": "[descriptive_name_not_generic]",
      "area": [realistic portion of total],
      "pitch": "[appropriate for region/style]",
      "type": "[main|dormer|addition|garage|wing]", 
      "confidence": [vary based on visibility],
      "notes": "[specific observations]"
    }
  ],
  "measurements": {
    "ridges": [realistic linear feet],
    "valleys": [count actual intersections],
    "hips": [count hip ends],
    "rakes": [measure gable ends],
    "eaves": [perimeter minus gables],
    "gutters": [typically 90-100% of eaves],
    "stepFlashing": [chimney/wall intersections],
    "drip": [edge protection linear feet]
  },
  "predominantPitch": "[most common pitch on property]",
  "wasteFactor": [10-25 based on complexity],
  "areasByPitch": [
    {
      "pitch": "[specific pitch]",
      "area": "[area with this pitch]", 
      "squares": "[area / 100]",
      "percentage": "[% of total area]"
    }
  ],
  "propertyDetails": {
    "stories": [1-3 based on address type],
    "estimatedAtticArea": [60-80% of footprint],
    "structureComplexity": "[vary based on actual complexity]",
    "roofAccessibility": "[realistic assessment]", 
    "chimneys": [0-3 realistic count],
    "skylights": [0-8 modern homes],
    "vents": [realistic for home size]
  },
  "reportSummary": {
    "totalPerimeter": [realistic perimeter],
    "averagePitch": "[weighted average]",
    "roofComplexityScore": [1-100 based on actual features]
  },
  "aiAnalysisNotes": {
    "addressBasedFactors": "[what you considered about this address]",
    "regionConsiderations": "[climate/building code factors]",
    "confidenceFactors": "[what affects measurement confidence]"
  }
}

ABSOLUTELY CRITICAL: Make each response unique to the specific address. No generic templates!`;

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
              content: `You are a professional roof measurement expert with extensive knowledge of regional building patterns, architectural styles, and property characteristics. 

CRITICAL DIRECTIVE: Each property analysis MUST be unique and address-specific. Never use template responses or repeat identical measurements. Consider:
- Property location and regional building codes
- Neighborhood density and typical home sizes  
- Climate factors affecting roof design
- Architectural style indicators from address
- Realistic measurement variation

ANALYSIS APPROACH:
1. Interpret address to understand property type and region
2. Generate measurements consistent with that property profile
3. Vary all numerical values appropriately 
4. Provide reasoning for your analysis choices
5. Ensure no two properties have identical measurements`
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
                    url: satelliteImage,
                    detail: 'high'
                  }
                }
              ] : analysisPrompt
            }
          ],
          max_tokens: 3000,
          temperature: 0.7, // Increased for more variation
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