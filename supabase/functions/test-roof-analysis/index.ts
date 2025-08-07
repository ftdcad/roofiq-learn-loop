import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { address, testType = 'basic' } = await req.json();
    
    console.log(`🧪 Testing roof analysis for: ${address} (${testType})`);

    // Test different analysis approaches
    let analysisPrompt;
    
    if (testType === 'detailed') {
      analysisPrompt = `
Analyze this specific address: "${address}" and provide UNIQUE, VARIED roof measurements.

CRITICAL REQUIREMENTS:
1. DO NOT use template responses
2. Each address must have DIFFERENT measurements
3. Vary the total area significantly based on property type
4. Count actual roof features, not generic templates
5. Return measurements that reflect the specific property

For suburban homes: 1,500-2,500 sq ft
For large homes: 2,500-4,500 sq ft  
For small homes: 800-1,800 sq ft

Return ONLY this JSON structure:
{
  "address": "${address}",
  "analysis_type": "detailed_ai",
  "timestamp": "${new Date().toISOString()}",
  "totalArea": [UNIQUE NUMBER - vary based on property],
  "facets": [
    {
      "id": "main_roof",
      "area": [NUMBER],
      "pitch": "[VARY: 4/12, 5/12, 6/12, 8/12, 10/12]",
      "type": "main",
      "confidence": [VARY 75-95]
    }
  ],
  "predominantPitch": "[MATCH ACTUAL PROPERTY]",
  "complexity": "[VARY: Simple, Moderate, Complex, Very Complex]",
  "confidence": [VARY 70-95],
  "reasoning": "Real analysis of ${address} shows [SPECIFIC DETAILS]"
}`;
    } else {
      analysisPrompt = `
Simple test for address: ${address}
Just return a basic JSON with:
- A random area between 1000-5000 sq ft (make it unique!)
- 1-8 facets (vary it!)
- Different pitch each time
- Current timestamp

Make each response DIFFERENT and UNIQUE!`;
    }

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
            content: `You are a roof measurement AI. CRITICAL: Each address gets UNIQUE measurements. Never repeat the same numbers. Make every response different and address-specific.`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.8, // Higher temperature for more variation
        response_format: { type: "json_object" }
      })
    });

    if (!openaiRequest.ok) {
      const errorData = await openaiRequest.json().catch(() => ({}));
      console.error(`❌ OpenAI API error ${openaiRequest.status}:`, errorData);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `OpenAI API error: ${openaiRequest.status}`,
          details: errorData
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiResponse = await openaiRequest.json();
    const aiContent = openaiResponse.choices[0].message.content;
    
    let prediction;
    try {
      prediction = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid AI response format',
          rawResponse: aiContent
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Test analysis completed for ${address}:`, {
      area: prediction.totalArea,
      facets: prediction.facets?.length || 'unknown',
      confidence: prediction.confidence
    });

    return new Response(
      JSON.stringify({
        success: true,
        testType,
        address,
        prediction,
        meta: {
          model: 'gpt-4.1-2025-04-14',
          temperature: 0.8,
          timestamp: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in test-roof-analysis function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});