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
          working: false, 
          error: 'OPENAI_API_KEY not found in Supabase secrets',
          details: 'Please add your OpenAI API key in Supabase Dashboard → Settings → API'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!openaiApiKey.startsWith('sk-')) {
      return new Response(
        JSON.stringify({ 
          working: false, 
          error: 'Invalid API key format',
          details: 'OpenAI API keys should start with "sk-"'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test OpenAI connection
    const testResponse = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!testResponse.ok) {
      const errorData = await testResponse.json().catch(() => ({}));
      let errorMessage = 'Unknown error';
      
      if (testResponse.status === 401) {
        errorMessage = 'Invalid API key - Check your OpenAI API key';
      } else if (testResponse.status === 429) {
        errorMessage = 'Rate limited - Too many requests';
      } else if (testResponse.status === 402) {
        errorMessage = 'Payment required - Add credits to your OpenAI account';
      } else if (testResponse.status === 403) {
        errorMessage = 'Forbidden - API key may not have required permissions';
      }

      return new Response(
        JSON.stringify({ 
          working: false, 
          error: errorMessage,
          details: `HTTP ${testResponse.status}: ${errorData.error?.message || 'No details available'}`,
          status: testResponse.status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const models = await testResponse.json();
    const hasGPT4Vision = models.data.some((model: any) => 
      model.id.includes('gpt-4') && (model.id.includes('vision') || model.id.includes('gpt-4o'))
    );

    // Test a simple chat completion
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: 'Say "OpenAI connection test successful"' }
        ],
        max_tokens: 20
      })
    });

    if (!chatResponse.ok) {
      return new Response(
        JSON.stringify({ 
          working: false, 
          error: 'Chat completion test failed',
          details: `HTTP ${chatResponse.status}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const chatData = await chatResponse.json();
    const testMessage = chatData.choices[0]?.message?.content || '';

    return new Response(
      JSON.stringify({ 
        working: true, 
        model: 'gpt-4o-mini',
        hasGPT4Vision,
        testMessage,
        availableModels: models.data.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error testing OpenAI connection:', error);
    return new Response(
      JSON.stringify({ 
        working: false, 
        error: 'Connection test failed',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});