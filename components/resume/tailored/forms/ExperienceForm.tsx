'use client';

import React from 'react';
import { WorkExperience } from '@/lib/types/resume';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
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

interface ExperienceFormProps {
  data: WorkExperience[];
  onChange: (data: WorkExperience[]) => void;
  resumeId: string;
  onRegenerateStart?: (type: string) => void;
}

export const ExperienceForm = ({ data, onChange, resumeId, onRegenerateStart }: ExperienceFormProps) => {
  const [isRegenerateOpen, setIsRegenerateOpen] = React.useState(false);
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null);
  const [userInstruction, setUserInstruction] = React.useState('Rewrite this to be more impactful and use strong action verbs.');
  
  const { mutate: regenerateItem, isPending: isRegenerating } = trpc.resume.regenerateItem.useMutation({
      onSuccess: () => {
          setIsRegenerateOpen(false);
          toast.success("Regeneration started. AI is rewriting...");
      },
      onError: (err) => {
          toast.error(`Regeneration failed: ${err.message}`);
      }
  });

  const handleOpenRegenerate = (id: string) => {
      setSelectedItemId(id);
      setIsRegenerateOpen(true);
  };

  const handleConfirmRegenerate = () => {
      if (!selectedItemId || !resumeId) return;
      const item = data.find(i => i.id === selectedItemId);
      if (!item) return;

      onRegenerateStart?.('regenerating_item');
      regenerateItem({
          resumeId: resumeId,
          itemId: selectedItemId,
          itemType: 'work_experience',
          title: item.title,
          subtitle: item.company,
          currentDescription: item.description,
          userInstruction: userInstruction
      });
  };

  const handleAdd = () => {
    const newItem: WorkExperience = {
      id: crypto.randomUUID(),
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: [],
    };
    onChange([newItem, ...data]);
  };

  const handleChange = (id: string, field: keyof WorkExperience, value: any) => {
    onChange(data.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDelete = (id: string) => {
    onChange(data.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b pb-3">
        <h4 className="text-xl font-semibold">Work Experience</h4>
        <Button size="sm" variant="ghost" onClick={handleAdd} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
           <Plus className="w-4 h-4 mr-1" /> Add Job
        </Button>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => (
           <ExperienceItem 
              key={item.id} 
              item={item} 
              index={index} 
              onChange={(field, value) => handleChange(item.id, field, value)}
              onDelete={() => handleDelete(item.id)}
              onRegenerate={() => handleOpenRegenerate(item.id)}
           />
        ))}
        {data.length === 0 && (
            <div className="text-center p-8 text-gray-400 border-2 border-dashed border-gray-200 rounded bg-gray-50/50">
                No work experience added yet.
            </div>
        )}
      </div>

        <Dialog open={isRegenerateOpen} onOpenChange={setIsRegenerateOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Regenerate with AI</DialogTitle>
                    <DialogDescription>
                        Give instructions to the AI on how to improve this experience description.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Instructions</Label>
                        <Textarea 
                            value={userInstruction}
                            onChange={(e) => setUserInstruction(e.target.value)}
                            placeholder="e.g. Highlight leadership skills, quantify achievements..."
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

const ExperienceItem = ({ item, index, onChange, onDelete, onRegenerate }: { item: WorkExperience, index: number, onChange: (field: keyof WorkExperience, value: any) => void, onDelete: () => void, onRegenerate: () => void }) => {
    const [isOpen, setIsOpen] = React.useState(index === 0);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2 overflow-hidden">
                    <CollapsibleTrigger asChild>
                         <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                         </Button>
                    </CollapsibleTrigger>
                    <span className="font-semibold truncate">
                        {item.title || '(No Title)'} {item.company ? `at ${item.company}` : ''}
                    </span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={onDelete}>
                    <Trash className="w-3 h-3" />
                </Button>
            </div>
            
            <CollapsibleContent>
                <div className="p-4 space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Job Title</Label>
                            <Input value={item.title} onChange={(e) => onChange('title', e.target.value)} placeholder="Senior Developer" />
                        </div>
                        <div className="space-y-2">
                            <Label>Company</Label>
                            <Input value={item.company} onChange={(e) => onChange('company', e.target.value)} placeholder="Acme Inc." />
                        </div>
                         <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input value={item.startDate} onChange={(e) => onChange('startDate', e.target.value)} placeholder="Jan 2020" />
                        </div>
                         <div className="space-y-2">
                            <Label>End Date</Label>
                            <div className="flex gap-2">
                                <Input 
                                    value={item.endDate} 
                                    onChange={(e) => onChange('endDate', e.target.value)} 
                                    placeholder="Present" 
                                    disabled={item.current}
                                    className={item.current ? "opacity-50" : ""}
                                />
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    <Checkbox 
                                        id={`current-${item.id}`} 
                                        checked={item.current} 
                                        onCheckedChange={(c) => onChange('current', c === true)} 
                                    />
                                    <Label htmlFor={`current-${item.id}`} className="font-normal text-xs">Current</Label>
                                </div>
                            </div>
                        </div>
                         <div className="space-y-2 md:col-span-2">
                             <Label>Location</Label>
                             <Input value={item.location} onChange={(e) => onChange('location', e.target.value)} placeholder="Remote / New York, NY" />
                         </div>
                     </div>
                     
                     <div className="space-y-2">
                         <Label>Description (Bullet Points)</Label>
                         {/* Simple implementation: Textarea splitting by newline for bullet points */}
                         <Textarea 
                            value={Array.isArray(item.description) ? item.description.join('\\n') : item.description} 
                            onChange={(e) => onChange('description', e.target.value.split('\\n'))} 
                            placeholder="• Developed new features for...&#10;• Improved performance by 50%..."
                            className="min-h-[120px] font-normal"
                        />
                         <p className="text-xs text-gray-400">Enter each bullet point on a new line.</p>
                     </div>
                     <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={onRegenerate} className="text-purple-600 border-purple-200 hover:bg-purple-50">
                            <Sparkles className="w-3.5 h-3.5 mr-2" />
                            Regenerate with AI
                        </Button>
                     </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}
