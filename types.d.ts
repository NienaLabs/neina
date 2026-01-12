 interface ResumeExtraction {
  address: {
    email?: string
    location?: string
    telephone?: string
    linkedInProfile?: string
    githubProfile?: string
    portfolio?: string
    otherLinks?: string[]
  }

  profile?: string
  summary?: string
  objective?: string

  education?: {
    institution?: string
    degree?: string
    fieldOfStudy?: string
    startDate?: string
    endDate?: string
    grade?: string
    description?: string
    location?:string
  }[]

  experience?: {
    company?: string
    position?: string
    startDate?: string
    endDate?: string
    location?: string
    description?: string
    achievements?: string[]
    title?: string
    responsibilities?: string[]
  }[]

  skills?: Record<string,string[]>
  certifications?: {
    name?: string
    issuer?: string
    year?: string
    description?: string
  }[]

  projects?: {
    name?: string
    description?: string
    technologies?: string[]
    link?: string
    role?: string
  }[]

  awards?: {
    title?: string
    issuer?: string
    year?: string
    description?: string
  }[]

  publications?: {
    title?: string
    publisher?: string
    date?: string
    description?: string
    link?:string
  }[]

  languages?: {
    name?: string
    proficiency?: string
  }[]

  hobbies?: string[]

  /**
   * Any sections not part of our schema
   * e.g. "Volunteer Experience", "Research", etc.
   */
  customSections?:   {
      sectionName: string,
      entries: [
        {
          title?: string,
          organization?: string,
          description?: string,
          year?: string
        }
      ]
    }[]
}

interface ResumeAnalysis {
  /**
   * Number of issues considered critical (must-fix)
   */
  criticalFixes: number

  /**
   * Number of issues considered urgent but not critical
   */
  urgentFixes: number

  low:number

  totalFixes:number
  /**
   * Detailed fixes per section
   * Each section contains an array of issue objects
   */
  fixes: Record<
    string,
    {
      issue: string
      suggestion: string
      severity: 'critical' | 'urgent' | 'low'
    }[],
    string,Record<
    string,
       {
          issue: string,
          suggestion: string,
          severity: string
        }
    
    >
  >
}

interface ResumeScore {
  scores: {
    profile: number;
    education: number;
    experience: number;
    projects: number;
    skills: number;
    certifications: number;
    awards: number;
    publications: number;
    overallScore: number;
  };
  customSections: {
    sectionName: string;
    score: number;
    remarks: string;
  }[];
  roleMatch: {
    targetRole: string;
    matchPercentage: number;
    missingSkills: string[];
    recommendations: string[];
  };
}
interface AgoraLocalUserInfo {
  token: string;
  uid: string;
  channel: string;
  agentId?: string;
}
interface ConversationComponentProps {
  agoraLocalUserInfo: AgoraLocalUserInfo;
  onTokenWillExpire: (uid: string) => Promise<string>;
  onEndConversation: () => void;
}
interface ClientStartRequest {
  requester_id: string;
  channel_name: string;
  input_modalities: string[];
  output_modalities: string[];
  systemPrompt?: string;
  interviewId?: string;
}

interface MicrosoftTTSParams {
  key: string;
  region: string;
  voice_name: string;
  rate?: number;
  volume?: number;
}

interface ElevenLabsTTSParams {
  key: string;
  voice_id: string;
  model_id: string;
}
type TTSVendor = 'microsoft' | 'elevenlabs' | 'google';
interface TTSConfig {
  vendor: TTSVendor;
  params: MicrosoftTTSParams | ElevenLabsTTSParams;
}
interface AgoraStartRequest {
  name: string;
  properties: {
    channel: string;
    token: string;
    agent_rtc_uid: string;
    remote_rtc_uids: string[];
    enable_string_uid?: boolean;
    idle_timeout?: number;
    advanced_features?: {
      enable_aivad?: boolean;
      enable_bhvs?: boolean;
    };
    asr: {
      language: string;
      task?: string;
    };
    llm: {
      url?: string;
      api_key?: string;
      system_messages: Array<{
        role: string;
        content: string;
      }>;
      greeting_message: string;
      failure_message: string;
      max_history?: number;
      input_modalities?: string[];
      output_modalities?: string[];
      params: {
        model: string;
        max_tokens: number;
        temperature?: number;
        top_p?: number;
      };
    };
    vad: {
      silence_duration_ms: number;
      speech_duration_ms?: number;
      threshold?: number;
      interrupt_duration_ms?: number;
      prefix_padding_ms?: number;
    };
    tts: TTSConfig;
  };
}
interface StopConversationRequest {
  agent_id: string;
}

interface AgentResponse {
  agent_id: string;
  create_ts: number;
  state: string;
}
