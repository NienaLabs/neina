import { NextResponse } from "next/server";
import { getRemainingTime } from "@/lib/interviews";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const interview_id = searchParams.get('interview_id');
    
    if (!interview_id) {
      return NextResponse.json({ error: "Missing interview_id" }, { status: 400 });
    }

    const result = await getRemainingTime(interview_id);

    return NextResponse.json(result);

  } catch (err: any) {
    console.error('Get remaining time error:', err);
    return NextResponse.json({ error: err.message || "Failed to get remaining time" }, { status: 500 });
  }
}
