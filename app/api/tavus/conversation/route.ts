import { NextResponse } from "next/server";
import { createTavusConversation } from "@/lib/tavus";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, description } = body;
    
    if (!role || typeof role !== 'string') {
      return NextResponse.json(
        { error: "role is required and must be a string" },
        { status: 400 }
      );
    }
    
    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: "description is required and must be a string" },
        { status: 400 }
      );
    }
    
    const result = await createTavusConversation(role, description);
    console.log('Tavus conversation created:',{ conversation_id: result.conversation_id});
    if (!result?.url || !result?.conversation_id){
      throw new Error ('Invalid response  from Tavus API');
    }
    return NextResponse.json({ 
      url: result.url,
      conversation_id: result.conversation_id 
    });
  } catch (err: any) {
    console.error('Tavus API error:', err);
    return NextResponse.json({ error: err.message || "Failed to create conversation" }, { status: 500 });
  }
}
