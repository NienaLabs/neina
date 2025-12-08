import { notFound } from 'next/navigation';
import { trpc } from '@/trpc/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ResumeExtraction } from '@/components/resume/editor/types';
import PDFPreviewPageClient from '@/components/resume/pdf/PDFPreviewPageClient';

interface Props {
  params: Promise<{ resumeId: string }>;
}

const PDFPreviewPage = async ({ params }: Props) => {
  const { resumeId } = await params;
  const resume = await trpc.resume.getUnique({ resumeId });

  if (!resume) {
    return notFound();
  }

  const { extractedData, name } = resume;

  // Parse extractedData if it's a string, or use it directly if it's an object
  // Based on the schema, it's Json?, so it could be anything.
  // In the editor page, it handles string parsing.
  let parsedData: ResumeExtraction | null = null;
  
  if (extractedData) {
      try {
          parsedData = typeof extractedData === 'string' 
              ? JSON.parse(extractedData) 
              : extractedData as unknown as ResumeExtraction;
      } catch (e) {
          console.error("Failed to parse extractedData", e);
      }
  }

  if (!parsedData) {
      return <div>Error: Could not load resume data.</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-muted/10">
      <div className="p-4 border-b bg-background flex items-center gap-4">
        <Link href={`/resume/edit/${resumeId}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Editor
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">PDF Preview: {name}</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <PDFPreviewPageClient data={parsedData} fullName={name} />
      </div>
    </div>
  );
};

export default PDFPreviewPage;
