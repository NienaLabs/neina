// lib/tavus.ts
/**
 * createTavusConversation
 * Server-side only function to create a Tavus conversation.
 */
export async function createTavusConversation(role?: string, description?: string): Promise<{ url: string; conversation_id: string }> {
  const API_KEY = process.env.TAVUS_API_KEY;
  const PERSONA_ID = process.env.TAVUS_PERSONA_ID;
  const REPLICA_ID = process.env.TAVUS_REPLICA_ID;

  if (!API_KEY || !PERSONA_ID || !REPLICA_ID) {
    throw new Error("TAVUS_API_KEY, TAVUS_PERSONA_ID, or TAVUS_REPLICA_ID is not configured");
  }

  const requestBody: any = {
    persona_id: PERSONA_ID, 
    replica_id: REPLICA_ID,
  };

  // Add conversational context if role or description provided
  if (role || description) {
    let context = "You are conducting an interview for the position of ";
    if (role) {
      context += role;
    }
    if (description) {
      context += `. The candidate has the following background/experience: ${description}`;
    }
    context += ". Please tailor your questions to assess their suitability for this specific role and experience level.";
    
    requestBody.conversational_context = context;
  }

  const res = await fetch("https://tavusapi.com/v2/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create Tavus conversation: ${res.status} - ${text}`);
  }

  const data = await res.json();
  console.log('Full Tavus API response:', data);
  
  if (!data?.conversation_url) {
    throw new Error("Tavus API did not return conversation_url");
  }

  if (!data?.conversation_id) {
    throw new Error("Tavus API did not return conversation_id");
  }

  return { 
    url: data.conversation_url,
    conversation_id: data.conversation_id
  };
}

/**
 * endTavusConversation
 * Server-side only function to end a Tavus conversation.
 */


export async function endTavusConversation(conversation_id: string): Promise<{ success: boolean; alreadyEnded: boolean }> {
  const API_KEY = process.env.TAVUS_API_KEY;

  console.log('endTavusConversation called with:', { 
    conversation_id, 
    hasApiKey: !!API_KEY,
    conversationIdLength: conversation_id?.length,
    conversationIdType: typeof conversation_id
  });

  if (!API_KEY) {
    throw new Error("TAVUS_API_KEY is not configured");
  }

  if (!conversation_id) {
    throw new Error("conversation_id is required");
  }

  console.log(`conversation_id format check: ${conversation_id} (length: ${conversation_id.length})`);
  
  // Validate conversation_id format (should be a UUID-like string)
  if (conversation_id.length < 10) {
    console.error('conversation_id seems too short:', conversation_id);
    throw new Error("Invalid conversation_id format");
  }

  const url = `https://tavusapi.com/v2/conversations/${conversation_id}/end`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    console.log(`Tavus API response status: ${res.status} ${res.statusText}`);
    console.log(`Response headers:`, Object.fromEntries(res.headers.entries()));

    // Try to get response body for more info
    let responseBody = '';
    try {
      responseBody = await res.text();
      console.log('Tavus API response body:', responseBody);
    } catch (error) {
      console.error('Error reading response body:', error);
      throw new Error(`Failed to read Tavus response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check if conversation was already ended (idempotency)
    if (res.status === 404 || (res.status === 400 && responseBody.includes('already ended'))) {
      console.log('Tavus conversation was already ended (idempotent)');
      return { success: true, alreadyEnded: true };
    }

    if (!res.ok) {
      throw new Error(`Failed to end conversation: ${res.status} ${res.statusText} - ${responseBody}`);
    }

    console.log('Successfully ended Tavus conversation');
    return { success: true, alreadyEnded: false };
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request to Tavus API timed out after 10 seconds');
    }
    throw error;
  }
}

/**
 * deleteTavusConversation
 * Server-side only function to delete/cleanup a Tavus conversation.
 */
export async function deleteTavusConversation(conversation_id: string): Promise<void> {
  const API_KEY = process.env.TAVUS_API_KEY;

  if (!API_KEY) {
    throw new Error("TAVUS_API_KEY is not configured");
  }

  if (!conversation_id) {
    throw new Error("conversation_id is required");
  }

  // Validate conversation_id format
  if (conversation_id.length < 10) {
    throw new Error("Invalid conversation_id format");
  }

  const url = `https://tavusapi.com/v2/conversations/${conversation_id}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "x-api-key": API_KEY,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    // 404 means already deleted - that's fine (idempotent)
    if (res.status === 404) {
      console.log('Tavus conversation already deleted or not found');
      return;
    }

    if (!res.ok) {
      const responseBody = await res.text();
      throw new Error(`Failed to delete conversation: ${res.status} ${res.statusText} - ${responseBody}`);
    }

    console.log('Successfully deleted Tavus conversation');
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request to Tavus API timed out after 10 seconds');
    }
    throw error;
  }
}
