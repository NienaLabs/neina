'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { trpc } from '@/trpc/client';

interface SkillsData {
    technicalSkills: string[];
    languages: string[];
    certificationsTraining: string[];
    awards: string[];
}

interface SkillsFormProps {
  data: SkillsData;
  onChange: (data: SkillsData) => void;
  resumeId: string;
  onRegenerateStart?: (type: string) => void;
}

export const SkillsForm = ({ data, onChange, resumeId, onRegenerateStart }: SkillsFormProps) => {
    const [isRegenerateOpen, setIsRegenerateOpen] = React.useState(false);
    const [userInstruction, setUserInstruction] = React.useState('Add more relevant keywords based on my experience and modern tech stack.');

    const { mutate: regenerateSkills, isPending: isRegenerating } = trpc.resume.regenerateSkills.useMutation({
        onSuccess: () => {
            setIsRegenerateOpen(false);
            toast.success("Regeneration started. AI is finding new skills...");
        },
        onError: (err) => {
            toast.error(`Regeneration failed: ${err.message}`);
        }
    });

    const handleConfirmRegenerate = () => {
        if (!resumeId) return;
        
        onRegenerateStart?.('regenerating_skills');
        regenerateSkills({
            resumeId: resumeId,
            currentSkills: data.technicalSkills,
            userInstruction: userInstruction
        });
    };
    
    // Helper to handle simple comma or newline separated lists converted to array
    const handleListChange = (field: keyof SkillsData, value: string) => {
        // preserve newlines for textarea view, but store as array
        // Logic: Try to split by common delimiters
        const array = value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        onChange({ ...data, [field]: array });
    };

    const getDisplayValue = (arr: string[]) => {
        return (arr || []).join(', ');
    };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-2">
         <h4 className="font-bold text-gray-700">Skills & Additional</h4>
       </div>

       <div className="space-y-4">
           <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Technical Skills</Label>
                    <Button variant="ghost" size="sm" onClick={() => setIsRegenerateOpen(true)} className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 h-6 text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Suggest
                    </Button>
                </div>
                <Textarea 
                    value={getDisplayValue(data.technicalSkills)}
                    onChange={(e) => handleListChange('technicalSkills', e.target.value)}
                    placeholder="React, TypeScript, Node.js, Python..."
                    className="min-h-[80px]"
                />
                <p className="text-xs text-gray-400">Separate skills with commas.</p>
           </div>

           <div className="space-y-2">
                <Label>Languages</Label>
                <Input 
                    value={getDisplayValue(data.languages)}
                    onChange={(e) => handleListChange('languages', e.target.value)}
                    placeholder="English (Native), Spanish (Intermediate)..."
                />
           </div>

            <div className="space-y-2">
                <Label>Certifications</Label>
                <Textarea 
                    value={getDisplayValue(data.certificationsTraining)}
                    onChange={(e) => handleListChange('certificationsTraining', e.target.value)}
                    placeholder="AWS Certified Solutions Architect, Google Cloud Professional..."
                     className="min-h-[80px]"
                />
                <p className="text-xs text-gray-400">Separate certifications with commas.</p>
           </div>
           

           
           <div className="space-y-2">
                <Label>Awards</Label>
                 <Textarea 
                    value={getDisplayValue(data.awards)}
                    onChange={(e) => handleListChange('awards', e.target.value)}
                    placeholder="Employee of the Month (2023)..."
                     className="min-h-[80px]"
                />
                <p className="text-xs text-gray-400">Separate awards with commas.</p>
           </div>


       </div>
        <Dialog open={isRegenerateOpen} onOpenChange={setIsRegenerateOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Regenerate Skills</DialogTitle>
                    <DialogDescription>
                        Ask AI to suggest more relevant technical skills or organize them better.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Instructions</Label>
                        <Textarea 
                            value={userInstruction}
                            onChange={(e) => setUserInstruction(e.target.value)}
                            placeholder="e.g. Add skills related to React and Node.js..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRegenerateOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmRegenerate} disabled={isRegenerating}>
                        {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {isRegenerating ? 'Starting...' : 'Regenerate'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
};
