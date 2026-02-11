'use client';

import React from 'react';
import { Education } from '@/lib/types/resume';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';

interface EducationFormProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

export const EducationForm = ({ data, onChange }: EducationFormProps) => {
  const handleAdd = () => {
    const newItem: Education = {
      id: crypto.randomUUID(),
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: [],
    };
    onChange([newItem, ...data]);
  };

  const handleChange = (id: string, field: keyof Education, value: any) => {
    onChange(data.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDelete = (id: string) => {
    onChange(data.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-gray-100 p-2 border border-gray-200">
        <h4 className="font-bold text-gray-700">Education</h4>
        <Button size="sm" variant="ghost" onClick={handleAdd} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
           <Plus className="w-4 h-4 mr-1" /> Add Education
        </Button>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => (
           <EducationItem 
              key={item.id} 
              item={item} 
              index={index} 
              onChange={(field, value) => handleChange(item.id, field, value)}
              onDelete={() => handleDelete(item.id)}
           />
        ))}
         {data.length === 0 && (
            <div key="no-education" className="text-center p-8 text-gray-400 border-2 border-dashed border-gray-200 rounded bg-gray-50/50">
                No education added yet.
            </div>
        )}
      </div>
    </div>
  );
};

const EducationItem = ({ item, index, onChange, onDelete }: { item: Education, index: number, onChange: (field: keyof Education, value: any) => void, onDelete: () => void }) => {
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
                        {item.institution || '(No Institution)'} {item.degree ? `- ${item.degree}` : ''}
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
                            <Label>Institution / School</Label>
                            <Input value={item.institution} onChange={(e) => onChange('institution', e.target.value)} placeholder="University of Technology" />
                        </div>
                        <div className="space-y-2">
                            <Label>Degree / Major</Label>
                            <Input value={item.degree} onChange={(e) => onChange('degree', e.target.value)} placeholder="Bachelor of Science in CS" />
                        </div>
                         <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input value={item.startDate} onChange={(e) => onChange('startDate', e.target.value)} placeholder="2016" />
                        </div>
                         <div className="space-y-2">
                            <Label>End Date</Label>
                            <div className="flex gap-2">
                                <Input 
                                    value={item.endDate} 
                                    onChange={(e) => onChange('endDate', e.target.value)} 
                                    placeholder="2020" 
                                    disabled={item.current}
                                    className={item.current ? "opacity-50" : ""}
                                />
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    <Checkbox 
                                        id={`edu-current-${item.id}`} 
                                        checked={item.current} 
                                        onCheckedChange={(c) => onChange('current', c === true)} 
                                    />
                                    <Label htmlFor={`edu-current-${item.id}`} className="font-normal text-xs">Current</Label>
                                </div>
                            </div>
                        </div>
                         <div className="space-y-2 md:col-span-2">
                             <Label>Location</Label>
                             <Input value={item.location} onChange={(e) => onChange('location', e.target.value)} placeholder="City, State" />
                         </div>
                     </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}
