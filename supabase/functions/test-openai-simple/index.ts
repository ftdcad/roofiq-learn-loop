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
        JSON.stringify({ 
          success: false,
          error: 'OPENAI_API_KEY not found in Supabase secrets',
          details: 'Please add your OpenAI API key in Supabase Dashboard → Settings → Functions',
          fix: 'Go to https://supabase.com/dashboard/project/vpinncisktmyarvaxxrm/settings/functions'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!openaiApiKey.startsWith('sk-')) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid OpenAI API key format',
          details: 'OpenAI API keys should start with "sk-"',
          currentKey: openaiApiKey.substring(0, 10) + '...' // Show first 10 chars for debugging
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔑 Testing OpenAI API key:', openaiApiKey.substring(0, 10) + '...');

    // Test simple chat completion first
    const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'user', content: 'Say "OpenAI Connected Successfully"' }
        ],
        max_tokens: 10
      })
    });

    console.log('📡 OpenAI Response Status:', testResponse.status);

    if (!testResponse.ok) {
      const errorData = await testResponse.json().catch(() => ({}));
      console.error('❌ OpenAI Error Response:', errorData);
      
      let errorMessage = 'Unknown error';
      let fix = '';
      
      if (testResponse.status === 401) {
        errorMessage = 'Invalid API key - Authentication failed';
        fix = 'Check your OpenAI API key at https://platform.openai.com/api-keys';
      } else if (testResponse.status === 429) {
        errorMessage = 'Rate limited - Too many requests or quota exceeded';
        fix = 'Check your usage at https://platform.openai.com/usage';
      } else if (testResponse.status === 402) {
        errorMessage = 'Payment required - No credits available';
        fix = 'Add payment method at https://platform.openai.com/settings/billing';
      } else if (testResponse.status === 404) {
        errorMessage = 'Model not found - GPT-4.1 might not be available';
        fix = 'Try using gpt-4o or gpt-4-turbo instead';
      }

      return new Response(
        JSON.stringify({ 
          success: false,
          error: errorMessage,
          status: testResponse.status,
          details: errorData,
          fix: fix,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseData = await testResponse.json();
    console.log('✅ OpenAI Success Response:', responseData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: responseData.choices[0]?.message?.content || 'No response content',
        model: responseData.model,
        usage: responseData.usage,
        timestamp: new Date().toISOString(),
        status: 'OpenAI API working correctly'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Test OpenAI Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Connection test failed',
        details: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});