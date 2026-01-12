import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { TTSVendor } from '../../../lib/constants';

// Helper function to validate and get all configuration
function getValidatedConfig() {
  // Validate Agora Configuration
  const agoraConfig = {
    baseUrl: process.env.NEXT_PUBLIC_AGORA_CONVO_AI_BASE_URL || '',
    appId: process.env.NEXT_PUBLIC_AGORA_APP_ID || '',
    appCertificate: process.env.NEXT_PUBLIC_AGORA_APP_CERTIFICATE || '',
    customerId: process.env.NEXT_PUBLIC_AGORA_CUSTOMER_ID || '',
    customerSecret: process.env.NEXT_PUBLIC_AGORA_CUSTOMER_SECRET || '',
    agentUid: process.env.NEXT_PUBLIC_AGENT_UID || 'Agent',
  };

  if (Object.values(agoraConfig).some((v) => v === '')) {
    throw new Error('Missing Agora configuration. Check your .env.local file');
  }

  // Validate LLM Configuration
  const llmConfig = {
    url: process.env.NEXT_PUBLIC_LLM_URL,
    api_key: process.env.NEXT_PUBLIC_LLM_API_KEY,
    model: process.env.NEXT_PUBLIC_LLM_MODEL,
  };

  if (!llmConfig.url || !llmConfig.api_key || !llmConfig.model) {
      throw new Error("Missing LLM configuration: url, api_key, or model");
  }

  // Specific check for invalid model names
  if (llmConfig.model === 'gpt-4.1') {
      throw new Error("Invalid LLM model: 'gpt-4.1' does not exist. Please use 'gpt-4o', 'gpt-4-turbo', or 'gpt-3.5-turbo'.");
  }

  // Check for Groq / OpenAI model mismatch
  if (llmConfig.url?.includes('groq.com') && llmConfig.model?.startsWith('gpt')) {
      throw new Error(`Invalid Config: You are using Groq URL but an OpenAI model name ('${llmConfig.model}'). Please use a Groq model like 'llama3-8b-8192' or 'mixtral-8x7b-32768'.`);
  }


  // Get TTS Vendor
  const ttsVendor =
    (process.env.NEXT_PUBLIC_TTS_VENDOR as TTSVendor) || TTSVendor.Microsoft;

  // Get Modalities Configuration
  const modalitiesConfig = {
    input: process.env.NEXT_PUBLIC_INPUT_MODALITIES?.split(',') || ['text'],
    output: process.env.NEXT_PUBLIC_OUTPUT_MODALITIES?.split(',') || [
      'text',
      'audio',
    ],
  };

  return {
    agora: agoraConfig,
    llm: llmConfig,
    ttsVendor,
    modalities: modalitiesConfig,
  };
}

// Helper function to get TTS configuration based on vendor
function getTTSConfig(vendor: TTSVendor) {
  if (vendor === TTSVendor.Microsoft) {
      const key = process.env.NEXT_PUBLIC_MICROSOFT_TTS_KEY;
      const region = process.env.NEXT_PUBLIC_MICROSOFT_TTS_REGION;
      
      if (!key || !region) {
          throw new Error(`Missing Microsoft TTS configuration: key or region is empty.`);
      }

    return {
      vendor: TTSVendor.Microsoft,
      params: {
        key,
        region,
        voice_name:
          process.env.NEXT_PUBLIC_MICROSOFT_TTS_VOICE_NAME ||
          'en-US-AriaNeural',
        rate: parseFloat(process.env.NEXT_PUBLIC_MICROSOFT_TTS_RATE || '1.0'),
        volume: parseFloat(
          process.env.NEXT_PUBLIC_MICROSOFT_TTS_VOLUME || '100.0'
        ),
      },
    };
  } else if (vendor === TTSVendor.ElevenLabs) {
      const key = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
      const voice_id = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID;
      const model_id = process.env.NEXT_PUBLIC_ELEVENLABS_MODEL_ID;

      if (!key || !voice_id || !model_id) {
          throw new Error(`Missing ElevenLabs TTS configuration: api_key, voice_id, or model_id is missing.`);
      }

    return {
      vendor: TTSVendor.ElevenLabs,
      params: {
        base_url: "wss://api.elevenlabs.io/v1",
        key,
        model_id,
        voice_id,
      },
    };
  }else if(vendor ===TTSVendor.Google){
      // Simplify Google validation for now as it uses credentials JSON
    return{
       vendor: TTSVendor.Google,
    params: {
        credentials: process.env.NEXT_PUBLIC_GOOGLE_VOICE_APP_CREDENTIALS,
        VoiceSelectionParams: {
            name: process.env.NEXT_PUBLIC_GOOGLE_MODEL_VOICE
        },
        AudioConfig: {
            speaking_rate: process.env.NEXT_PUBLIC_GOOGLE_MODEL_SPEAKING_RATE, 
            sample_rate_hertz: process.env.NEXT_PUBLIC_GOOGLE_MODEL_RATE_HERTZ
        }
    }
    }
  }

  throw new Error(`Unsupported TTS vendor: ${vendor}`);
}

import prisma from '@/lib/prisma';

// ... (existing imports)

export async function POST(request: Request) {
  try {
    // Get our configuration
    const config = getValidatedConfig();
    const body: ClientStartRequest = await request.json();
    const { requester_id, channel_name, input_modalities, output_modalities, interviewId } = body;

    let dynamicSystemPrompt = body.systemPrompt || 'You are a helpful assistant. Respond concisely and naturally as if in a spoken conversation.';
    let greetingMessage = 'Hello! are you ready for the interview?'; // Default

    if (interviewId) {
        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
            select: { 
              questions: true, 
              role: true, 
              type: true, 
              questionCount: true,
              user: {
                select: { name: true }
              }
            }
        });

        if (interview) {
             const candidateName = interview.user.name.split(' ')[0]; // First name
             const interviewType = interview.type || 'General';
             const questionCount = interview.questionCount || 10;
             const expectedDuration = Math.ceil(questionCount * 1.5);
             const interviewerName = "Sara";

             // Helper to get structure explanation
             const getStructureExplanation = (t: string) => {
                const typeStr = t.toUpperCase();
                if (typeStr === 'SCREENING') return "I'll ask about your background and qualifications.";
                if (typeStr === 'BEHAVIORAL') return "I'll ask scenario-based questions about your past experiences.";
                if (typeStr === 'TECHNICAL') return "I'll ask technical questions to assess your hard skills.";
                return "I'll ask a mix of behavioral and technical questions.";
             };

             const structureExplanation = getStructureExplanation(interview.type || 'GENERAL');

             // Construct the custom greeting
             greetingMessage = `Hi, ${candidateName}; welcome to a mock ${interviewType.toLowerCase()} interview. I’m ${interviewerName}. Before we begin, I’ll briefly explain the structure of this interview. ${structureExplanation} The interview will last about ${expectedDuration} minutes. Do you have any questions before we start?`;

             if (interview.questions && Array.isArray(interview.questions)) { 
                 const questions = interview.questions as string[];
                 if (questions.length > 0) {
                     dynamicSystemPrompt = `
                     You are ${interviewerName}, an AI interviewer conducting a ${interview.type} interview for the role of ${interview.role}.
                     Your goal is to ask the following questions one by one, listening to the candidate's response, and then moving to the next question.
                     Do not ask all questions at once. Ask one, wait for answer, acknowledge, then ask the next.
                     
                     Here are the questions:
                     ${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}
                     
                     Start by introducing yourself using the exact greeting message provided.
                     `;
                 }
             }
        }
    }


    // Generate a unique token for the AI agent
    const timestamp = Date.now();
    const expirationTime = Math.floor(timestamp / 1000) + 3600;

    const token = RtcTokenBuilder.buildTokenWithUid(
      config.agora.appId,
      config.agora.appCertificate,
      channel_name,
      config.agora.agentUid,
      RtcRole.PUBLISHER,
      expirationTime,
      expirationTime
    );

    // Check if we're using string UIDs
    const isStringUID = (str: string) => /[a-zA-Z]/.test(str);

    // Create a descriptive name for this conversation
    const uniqueName = `conversation-${timestamp}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    // Get the appropriate TTS configuration
    const ttsConfig = getTTSConfig(config.ttsVendor);

    // Prepare the request to the Agora Conversational AI API
    const requestBody = {
      name: uniqueName,
      properties: {
        channel: channel_name,
        token: token,
        agent_rtc_uid: config.agora.agentUid,
        remote_rtc_uids: [requester_id],
        enable_string_uid: isStringUID(config.agora.agentUid),
        idle_timeout: 30,
        // ASR (Automatic Speech Recognition) settings
        asr: {
          language: 'en-US',
          provider: 'agora', // Explicitly set provider
          task: 'conversation',
        },
        // LLM (Large Language Model) settings
        llm: {
          url: config.llm.url,
          api_key: config.llm.api_key,
          system_messages: [
            {
              role: 'system',
              content: dynamicSystemPrompt,
            },
          ],
          greeting_message: greetingMessage,
          failure_message: 'Please wait a moment while I process that.',
          max_history: 10,
          params: {
            model: config.llm.model || 'gpt-3.5-turbo',
            max_tokens: 1024,
            temperature: 0.7,
            top_p: 0.95,
          },
        //  input_modalities: input_modalities || config.modalities.input,
      //    output_modalities: output_modalities || config.modalities.output,
        },
        // VAD (Voice Activity Detection) settings
        vad: {
          silence_duration_ms: 1000, // Increased to wait longer before cutting off
          speech_duration_ms: 20000, 
          threshold: 0.4, // Lower threshold to be more sensitive to speech
          interrupt_duration_ms: 200,
          prefix_padding_ms: 300,
        },
        // TTS (Text-to-Speech) settings
        tts: ttsConfig,
      },
    };



    // Send the request to the Agora API
    const response = await fetch(
      `${config.agora.baseUrl}/${config.agora.appId}/join`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(
            `${config.agora.customerId}:${config.agora.customerSecret}`
          ).toString('base64')}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Agent start response:', {
        status: response.status,
        body: errorText,
      });
      throw new Error(
        `Failed to start conversation: ${response.status} ${errorText}`
      );
    }

    // Parse and return the response, which includes the agentID.
    // We'll need the agentID later, when its time to remove the agent.
    const data: AgentResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error starting conversation:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to start conversation',
      },
      { status: 500 }
    );
  }
}