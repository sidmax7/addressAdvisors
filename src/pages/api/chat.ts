import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check for API key from environment variables
    const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    console.log('Environment check:', {
      hasImportMetaEnv: !!import.meta.env.GEMINI_API_KEY,
      hasProcessEnv: !!process.env.GEMINI_API_KEY,
      keyLength: GEMINI_API_KEY?.length || 0
    });
    
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY environment variable is not set');
      return new Response(JSON.stringify({ error: 'Server configuration error - missing API key' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    // Add context about Address Advisors to the conversation
    const systemContext = `You are an AI assistant for Address Advisors, a real estate consultancy company. You help clients with property advice, market insights, buying/selling guidance, investment opportunities, and general real estate questions. Always be professional, helpful, and knowledgeable about real estate matters. Keep responses concise but informative.`;
    
    console.log('Making request to Gemini API...', {
      url: GEMINI_API_URL.replace(GEMINI_API_KEY, 'HIDDEN'),
      messageLength: message.length
    });
    
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemContext + '\n\nUser: ' + message
          }]
        }]
      })
    });

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error: ${response.status} - ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini API response structure:', {
      hasCandidates: !!data.candidates,
      candidatesLength: data.candidates?.length || 0,
      hasContent: !!(data.candidates?.[0]?.content),
      hasParts: !!(data.candidates?.[0]?.content?.parts)
    });
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Unexpected API response structure:', data);
      throw new Error('Invalid response from Gemini API');
    }
    
    const botResponse = data.candidates[0].content.parts[0].text;
    console.log('Successfully got response from Gemini API');

    return new Response(JSON.stringify({ response: botResponse }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({ 
        error: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment or contact us directly for immediate assistance.' 
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}; 