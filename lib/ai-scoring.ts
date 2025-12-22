
export interface AssessmentResult {
    score: number;
    feedback: string;
    strengths: string[];
    weaknesses: string[];
}

export async function generateInterviewScore(
    transcript: { role: string; content: string }[],
    role: string,
    description?: string,
    resumeContent?: string
): Promise<AssessmentResult> {
    const API_KEY = process.env.OPENAI_API_KEY || process.env.GITHUB_TOKEN;

    if (!API_KEY) {
        throw new Error("AI API Key (OPENAI_API_KEY or GITHUB_TOKEN) is not configured");
    }

    // Format transcript for the prompt
    const conversationText = transcript
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n");

    const systemPrompt = `You are an expert Hiring Manager and Interview Coach with 20 years of experience. 
You are evaluating a candidate for the role of: ${role}.
${description ? `Job Description context: ${description}` : ""}
${resumeContent ? `Candidate's Resume content: ${resumeContent}` : ""}

Your task is to analyze the following interview transcript and provide a quantitative and qualitative assessment.

Output valid JSON ONLY with this structure:
{
  "score": number, // 0-100 integer
  "feedback": string, // Comprehensive markdown summary of performance (2-3 paragraphs)
  "strengths": string[], // 3-5 key bullet points
  "weaknesses": string[] // 3-5 key bullet points
}

Scoring Criteria:
- Relevance: Did they answer the specific question asking?
- Depth: Did they provide specific examples (STAR method)?
- Communication: Was the answer clear and structured?
- Professionalism: Tone and language.

If the transcript is empty or too short to evaluate, return a score of 0 and explain why.`;

    try {
        const response = await fetch("https://models.github.ai/inference/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o", // Use gpt-4o for best reasoning
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Here is the interview transcript:\n\n${conversationText}` },
                ],
                temperature: 0.2, // Low temperature for consistent scoring
                response_format: { type: "json_object" }, // Enforce JSON
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`AI API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        if (!content) {
            throw new Error("AI returned empty response");
        }

        const result = JSON.parse(content);

        // Validate structure
        if (typeof result.score !== 'number' || !result.feedback) {
            throw new Error("AI returned invalid JSON structure");
        }

        return result as AssessmentResult;

    } catch (error) {
        console.error("Error generating interview score:", error);
        // Fallback or rethrow
        throw error;
    }
}
