'use client';

import React from 'react';
import { Project } from '@/lib/types/resume';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';

interface ProjectsFormProps {
  data: Project[];
  onChange: (data: Project[]) => void;
}

export const ProjectsForm = ({ data, onChange }: ProjectsFormProps) => {
  const handleAdd = () => {
    const newItem: Project = {
      id: crypto.randomUUID(),
      name: '',
      role: '',
      startDate: '',
      endDate: '',
      current: false,
      description: [],
    };
    onChange([newItem, ...data]);
  };

  const handleChange = (id: string, field: keyof Project, value: any) => {
    onChange(data.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDelete = (id: string) => {
    onChange(data.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-gray-100 p-2 border border-gray-200">
        <h4 className="font-bold text-gray-700">Projects</h4>
        <Button size="sm" variant="ghost" onClick={handleAdd} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
           <Plus className="w-4 h-4 mr-1" /> Add Project
        </Button>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => (
           <ProjectItem 
              key={item.id} 
              item={item} 
              index={index} 
              onChange={(field, value) => handleChange(item.id, field, value)}
              onDelete={() => handleDelete(item.id)}
           />
        ))}
         {data.length === 0 && (
            <div className="text-center p-8 text-gray-400 border-2 border-dashed border-gray-200 rounded bg-gray-50/50">
                No projects added yet.
            </div>
        )}
      </div>
    </div>
  );
};

const ProjectItem = ({ item, index, onChange, onDelete }: { item: Project, index: number, onChange: (field: keyof Project, value: any) => void, onDelete: () => void }) => {
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
                        {item.name || '(No Project Name)'}
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
                            <Label>Project Name</Label>
                            <Input value={item.name} onChange={(e) => onChange('name', e.target.value)} placeholder="Project Alpha" />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Input value={item.role} onChange={(e) => onChange('role', e.target.value)} placeholder="Lead Dev" />
                        </div>
                         <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input value={item.startDate} onChange={(e) => onChange('startDate', e.target.value)} placeholder="Jan 2021" />
                        </div>
                         <div className="space-y-2">
                            <Label>End Date</Label>
                            <div className="flex gap-2">
                                <Input 
                                    value={item.endDate} 
                                    onChange={(e) => onChange('endDate', e.target.value)} 
                                    placeholder="Feb 2021" 
                                    disabled={item.current}
                                    className={item.current ? "opacity-50" : ""}
                                />
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    <Checkbox 
                                        id={`proj-current-${item.id}`} 
                                        checked={item.current} 
                                        onCheckedChange={(c) => onChange('current', c === true)} 
                                    />
                                    <Label htmlFor={`proj-current-${item.id}`} className="font-normal text-xs">Current</Label>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Project URL</Label>
                            <Input value={item.url || ''} onChange={(e) => onChange('url', e.target.value)} placeholder="https://..." />
                        </div>
                     </div>
                     
                     <div className="space-y-2">
                         <Label>Description</Label>
                         <Textarea 
                            value={Array.isArray(item.description) ? item.description.join('\\n') : item.description} 
                            onChange={(e) => onChange('description', e.target.value.split('\\n'))} 
                            placeholder="• Built with Next.js..."
                            className="min-h-[100px] font-normal"
                        />
                     </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}
