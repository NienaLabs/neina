import { trpc } from "@/trpc/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {PDFParse,VerbosityLevel} from "pdf-parse";

// for commonjs
// require('pdf-parse/worker');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "PDF file not found" },
        { status: 400 }
      );
    }

    // Convert PDF file to buffer
    const arrayBuffer = await file.arrayBuffer();
    //const buffer = Buffer.from(arrayBuffer);

    // Parse PDF
    const parser = new  PDFParse({data:arrayBuffer,verbosity:VerbosityLevel.WARNINGS});
    const data = await parser.getText();
    await parser.destroy();
    await trpc.resume.create({content:data.text,name:(file.name).split('.pdf')[0]});
    return NextResponse.json({
      success:true,
      message:"resume uploaded successfully"
    },{status:201});
  } catch (error) {
    return NextResponse.json(
      { message: `An error occurred while processing the PDF: ${error}`,success:false },
      { status: 500 }
    );
  }
}