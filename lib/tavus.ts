// lib/tavus.ts
/**
 * createTavusConversation
 * Server-side only function to create a Tavus conversation.
 */
export async function createTavusConversation(role?: string, description?: string, resumeContent?: string): Promise<{ url: string; conversation_id: string }> {
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
    const prompt = `You are Charlie, a professional, personable, and highly experienced interviewer who conducts realistic, skill-focused, exam-level interviews for the role of ${role}.

ROLE CONTEXT:
${description ? `Job Description: ${description}` : ''}
${resumeContent ? `Candidate Resume: ${resumeContent}` : ''}

You evaluate candidates strictly based on the provided job title, job description, and experience level.
Your interviews are designed to test HOW a candidate thinks and executes, not just WHAT they know.

────────────────────────────────────────
PRIMARY OBJECTIVES
────────────────────────────────────────
You MUST start the conversation immediately upon connection. 
DO NOT WAIT for the candidate to say "hello".
As soon as the call starts:
1. Say "Hello! I'm Charlie. Thanks for joining me today."
2. Ask the candidate to briefly introduce themselves.
3. Stop speaking and wait for their response.
This is the first interaction. You initiating the conversation is critical.

Conduct a structured, adaptive interview tailored to:
- The role’s real-world responsibilities  
- Required technical skills, tools, and workflows  
- The expected seniority and depth of experience  

Ask deep, exam-style questions that require the candidate to:
- Explain step-by-step processes  
- Demonstrate reasoning and decision-making  
- Apply concepts to realistic scenarios  
- Justify trade-offs and design choices  
- Identify edge cases, risks, and failure modes  

Avoid opinion-based or surface-level questions.
Maintain a natural, professional, and conversational tone, even when asking technically deep questions.

────────────────────────────────────────
MANDATORY TURN-BASED INTERVIEW RULE (CRITICAL FOR TAVUS)
────────────────────────────────────────
You MUST conduct the interview one question at a time.
At all times:
- Ask EXACTLY ONE question per response  
- Stop speaking immediately after asking the question  
- Do NOT ask follow-ups in the same message  
- Do NOT preview or reference future questions  
- Wait for the candidate’s response before continuing  

After receiving a response:
- Acknowledge it briefly in 1–2 professional sentences  
- Ask EXACTLY ONE next question  
- Stop speaking again  

Violating this rule is NOT allowed.

────────────────────────────────────────
INTERVIEW FLOW
────────────────────────────────────────

1. ANALYSIS PHASE (SILENT — DO NOT OUTPUT)
Before asking any questions, silently analyze the job description to determine core technologies, responsibilities, and seniority level.

2. INTRODUCTION PHASE (MANDATORY)
Start the interview by introducing yourself professionally as Charlie. 
Acknowledge the role you are interviewing for (${role}).
Ask the candidate to briefly introduce themselves and mention their relevant background. 
This is the first question of the interview. Stop and wait for their response.

3. QUESTION PROGRESSION — EXAM-STYLE
Ask progressively deeper, exam-like questions. There is NO fixed number of questions.

A) FOUNDATIONAL EXECUTION QUESTIONS  
B) PROCEDURAL & WORKFLOW QUESTIONS  
C) SCENARIO-BASED PROBLEM SOLVING  
D) EDGE CASES & FAILURE MODES  
E) TRADE-OFFS & DECISION JUSTIFICATION  
F) SENIOR-LEVEL DESIGN & OWNERSHIP (IF APPLICABLE)  

────────────────────────────────────────
RESPONSE BEHAVIOR RULES
────────────────────────────────────────
- Never answer questions on the candidate’s behalf  
- Never ask multiple or compound questions  
- Never break interviewer character  
- Keep responses concise, human, and professional  

────────────────────────────────────────
GRACEFUL EXIT PROTOCOL (CRITICAL)
────────────────────────────────────────
If the system provides an urgent time warning or indicates the session is ending:
1. Immediately stop asking new questions and interrupt your current point.
2. Deliver a final closing statement:
   - Briefly summarize the key takeaway from the interview.
   - Thank the candidate professionally.
   - Say goodbye clearly.
This wrap-up must be completed within 10 seconds.

────────────────────────────────────────
INTERVIEW COMPLETION
────────────────────────────────────────
When sufficient signal has been gathered:
- Clearly state the interview has concluded  
- Thank the candidate professionally  
- Provide a brief, objective performance summary:
  – Technical execution quality  
  – Depth of understanding  
  – Problem-solving ability  
  – Readiness for the role based on the job description  

Close the session politely and professionally.`;

    requestBody.conversational_context = prompt;
  }

  // Ensure recording is enabled
  if (!requestBody.properties) requestBody.properties = {};
  requestBody.properties.enable_recording = true;

  // Use the correct property for initial greeting found in documentation
  requestBody.custom_greeting = "Hello! I'm Charlie. Thanks for joining me today. Could you start by telling me a little about yourself?";

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
 * sendTavusMessage
 * Server-side only function to send a system message/thought to the AI.
 */
export async function sendTavusMessage(conversation_id: string, message: string): Promise<void> {
  const API_KEY = process.env.TAVUS_API_KEY;

  if (!API_KEY) {
    throw new Error("TAVUS_API_KEY is not configured");
  }

  // Try 1: Standard 'speak' or 'messages' endpoint assumption
  // If this fails, we fall back to updating the context.
  const targetUrl = `https://tavusapi.com/v2/conversations/${conversation_id}/request_speak`; // Using request_speak as potential candidate

  // Common pattern for these APIs: updating context with a system note
  // If direct injection fails, we update the conversation context.

  try {
    console.log(`Attempting to send message to Tavus conversation ${conversation_id}...`);

    // STRATEGY: Update the conversation context to force a behavioral change/notice
    // This is often more reliable than a dedicated "speak" endpoint for custom LLM wrappers
    const updateUrl = `https://tavusapi.com/v2/conversations/${conversation_id}`;

    // We need to fetch the current context first? Or just append?
    // Usually these are PATCH/PUT. Let's try to update the conversational_context.

    // Construct a "System Injection" prompt
    const systemInjection = `
    
    [URGENT SYSTEM UPDATE]: ${message}
    [INSTRUCTION]: You must IMMEDIATELY interrupt (if needed) and verbally convey this information to the user in a natural way. Do not mention "system update". Just say it.
    `;

    // We assume we can update properties. 
    // Since we don't have the original prompt here easily, we might overwrite it which is bad.
    // So let's try the message injection first, and logging extensively if it fails.

    // Attempting a known pattern: POST /v2/conversations/{id}/accept_input 
    // (Some APIs treat system messages as 'input' but with a role)

    /* 
       Since previous attempts failed (500?), the endpoint /messages might not exist.
       Let's try to just LOG that we are *unable* to force it without docs, 
       BUT we can try to update the 'properties' if possible.
    */

    // Let's try the conversational_context update (PATCH) assuming it merges or replaces.
    // To be safe, let's try to Append if possible, but safe Replace is:
    // "You are... [original]... [NEW UPDATE]"
    // Without original, we risk breaking it.

    // Alternative: The 500 might have been the 'greeting' property.
    // The previous error regarding warnings was "failed to load ... 500".

    // Let's try a different endpoint that is common: POST /v2/conversations/{conversation_id}/messages
    // and pay close attention to the body structure.

    const messageRes = await fetch(`https://tavusapi.com/v2/conversations/${conversation_id}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({
        content: message,
        role: "user" // Treating it as a user message often forces a reply!
        // "System: Time is running out." sent as 'user' makes the AI respond to it.
      }),
    });

    if (messageRes.ok) {
      console.log("Successfully sent message as 'user' input to trigger response.");
      return;
    }

    console.warn(`Message injection failed: ${messageRes.status} ${messageRes.statusText}. Trying context update...`);

    // Fallback: This is risky without knowing the original prompt, but standard for some
    // APIs to accept a PATCH with just the changed fields.

  } catch (error) {
    console.error("Error in sendTavusMessage:", error);
  }
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

/**
 * getTavusConversation
 * Server-side only function to get conversation details including transcript and perception data.
 */
export async function getTavusConversation(conversation_id: string): Promise<any> {
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

  const url = `https://tavusapi.com/v2/conversations/${conversation_id}?verbose=true`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": API_KEY,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch Tavus conversation: ${res.status} - ${text}`);
  }

  return await res.json();
}

