import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { CustomSection } from '@/lib/types/resume';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface CustomSectionFormProps {
  sectionKey: string;
  sectionTitle: string;
  data: CustomSection;
  updateData: (key: string, data: CustomSection) => void;
}

export const CustomSectionForm: React.FC<CustomSectionFormProps> = ({
  sectionKey,
  sectionTitle,
  data,
  updateData,
}) => {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const items = data.items || [];

  const handleAddItem = () => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      description: '',
      date: '',
    };
    updateData(sectionKey, { ...data, items: [newItem, ...items] });
    setOpenItems((prev) => ({ ...prev, [newItem.id]: true }));
  };

  const handleUpdateItem = (id: string, field: string, value: string) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    updateData(sectionKey, { ...data, items: newItems });
  };

  const handleDeleteItem = (id: string) => {
    const newItems = items.filter((item) => item.id !== id);
    updateData(sectionKey, { ...data, items: newItems });
  };

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">
           Add and manage entries for {sectionTitle}.
        </p>
        <Button onClick={handleAddItem} size="sm" variant="outline" className="h-8 gap-1">
          <Plus className="w-3 h-3" /> Add Entry
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 bg-gray-50/50">
          <p className="text-sm">No entries added yet.</p>
          <Button onClick={handleAddItem} variant="link" size="sm" className="mt-2 text-blue-600">
            Add your first {sectionTitle} entry
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
             <Collapsible
                key={item.id}
                open={openItems[item.id]}
                onOpenChange={() => toggleItem(item.id)}
                className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden"
             >
                <div className="flex items-center p-3 bg-gray-50/50 gap-3">
                   <div className="cursor-move text-gray-400 hover:text-gray-600">
                      <GripVertical className="w-4 h-4" />
                   </div>
                   
                   <CollapsibleTrigger asChild>
                      <div className="flex-1 cursor-pointer min-w-0">
                         <h4 className="font-semibold text-sm truncate">
                             {item.name || '(Untitled Entry)'}
                         </h4>
                         <p className="text-xs text-gray-500 truncate">
                             {item.date}
                         </p>
                      </div>
                   </CollapsibleTrigger>

                   <div className="flex items-center gap-1">
                       <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteItem(item.id)}>
                           <Trash2 className="w-3 h-3" />
                       </Button>
                       <CollapsibleTrigger asChild>
                           <Button size="icon" variant="ghost" className="h-7 w-7">
                               {openItems[item.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                           </Button>
                       </CollapsibleTrigger>
                   </div>
                </div>

                <CollapsibleContent>
                   <div className="p-4 space-y-4 border-t border-gray-100">
                       <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                               <Label className="text-xs font-semibold text-gray-700">Name / Title / Role</Label>
                               <Input 
                                   value={item.name} 
                                   onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                                   placeholder="e.g. Volunteer Lead, Referee Name"
                                   className="h-8 text-sm"
                               />
                           </div>
                           <div className="space-y-1.5">
                               <Label className="text-xs font-semibold text-gray-700">Date / Year</Label>
                               <Input 
                                   value={item.date} 
                                   onChange={(e) => handleUpdateItem(item.id, 'date', e.target.value)}
                                   placeholder="e.g. 2023, 2024 - Present"
                                   className="h-8 text-sm"
                               />
                           </div>
                       </div>
                       
                       <div className="space-y-1.5">
                           <Label className="text-xs font-semibold text-gray-700">Description / Details</Label>
                           <Textarea 
                               value={item.description}
                               onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                               placeholder="Details about this entry..."
                               className="min-h-[80px] text-sm resize-none"
                           />
                       </div>

                       <div className="grid grid-cols-3 gap-4">
                           <div className="space-y-1.5">
                               <Label className="text-xs font-semibold text-gray-700">Role (Optional)</Label>
                               <Input 
                                   value={item.role || ''} 
                                   onChange={(e) => handleUpdateItem(item.id, 'role', e.target.value)}
                                   placeholder="e.g. Manager"
                                   className="h-8 text-sm"
                               />
                           </div>
                           <div className="space-y-1.5">
                               <Label className="text-xs font-semibold text-gray-700">Email (Optional)</Label>
                               <Input 
                                   value={item.email || ''} 
                                   onChange={(e) => handleUpdateItem(item.id, 'email', e.target.value)}
                                   placeholder="email@example.com"
                                   className="h-8 text-sm"
                               />
                           </div>
                           <div className="space-y-1.5">
                               <Label className="text-xs font-semibold text-gray-700">Phone (Optional)</Label>
                               <Input 
                                   value={item.phone || ''} 
                                   onChange={(e) => handleUpdateItem(item.id, 'phone', e.target.value)}
                                   placeholder="+1234567890"
                                   className="h-8 text-sm"
                               />
                           </div>
                       </div>
                   </div>
                </CollapsibleContent>
             </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
};
