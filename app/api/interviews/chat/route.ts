import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { interviewerSystemPrompt } from '@/constants/prompts';

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { interviewId, messages } = body;

        if (!interviewId || !messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        // Fetch interview details
        const interview = await prisma.interview.findUnique({
            where: { id: interviewId },
            include: {
                resume: true,
            },
        });

        if (!interview) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        if (interview.user_id !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Construct the system prompt
        const systemPrompt = interviewerSystemPrompt(
            interview.role || 'Professional Candidate',
            interview.description || '',
            interview.resume?.content || ''
        );

        // Prepare messages for OpenAI/Groq
        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.map((m: any) => ({
                role: m.role === 'interviewer' ? 'assistant' : 'user',
                content: m.content
            }))
        ];

        // Use Groq if available (seems more likely to be the intended LLM config)
        let LLM_URL = process.env.NEXT_PUBLIC_LLM_URL;
        let LLM_KEY = process.env.NEXT_PUBLIC_LLM_API_KEY;
        let LLM_MODEL = process.env.NEXT_PUBLIC_LLM_MODEL;

        // Fallback to OpenAI/GitHub Models if Groq isn't fully set
        if (!LLM_KEY || !LLM_URL) {
            LLM_URL = `${process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"}/chat/completions`;
            LLM_KEY = process.env.OPENAI_API_KEY;
            LLM_MODEL = process.env.OPENAI_MODEL || "gpt-4o";
        }

        if (!LLM_KEY) {
            throw new Error("No LLM API key configured (Groq or OpenAI)");
        }

        console.log(`[Interview Chat] Calling LLM: ${LLM_MODEL} at ${LLM_URL}`);

        const response = await fetch(LLM_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${LLM_KEY}`,
            },
            body: JSON.stringify({
                model: LLM_MODEL,
                messages: apiMessages,
                temperature: 0.7,
                max_tokens: 500,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("LLM API error:", errorText);

            // Try OpenAI fallback if Groq failed
            if (LLM_URL.includes("groq") && process.env.OPENAI_API_KEY) {
                console.log("[Interview Chat] Groq failed, trying OpenAI fallback...");

                try {
                    const fallbackResponse = await fetch(
                        `${process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"}/chat/completions`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                            },
                            body: JSON.stringify({
                                model: process.env.OPENAI_MODEL || "gpt-4o",
                                messages: apiMessages,
                                temperature: 0.7,
                                max_tokens: 500,
                            }),
                        }
                    );

                    if (fallbackResponse.ok) {
                        const fallbackData = await fallbackResponse.json();
                        return NextResponse.json({ message: fallbackData.choices[0].message.content });
                    }
                } catch (fallbackError) {
                    console.error("[Interview Chat] OpenAI fallback also failed:", fallbackError);
                }
            }

            return NextResponse.json({
                error: "Failed to get AI response",
                details: errorText.substring(0, 100)
            }, { status: 500 });
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        return NextResponse.json({ message: aiResponse });

    } catch (error: any) {
        console.error("Interview chat error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
