import { NextResponse } from "next/server";
import { deleteTavusConversation } from "@/lib/tavus";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    
    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }
    
    await deleteTavusConversation(conversationId);
    
    return NextResponse.json({ 
      success: true,
      message: "Conversation deleted successfully" 
    });
  } catch (err: any) {
    console.error('Tavus DELETE error:', err);
    return NextResponse.json({ 
      error: err.message || "Failed to delete conversation" 
    }, { status: 500 });
  }
}