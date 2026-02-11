'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableSectionWrapperProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const DraggableSectionWrapper = ({
  id,
  children,
  disabled,
}: DraggableSectionWrapperProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative bg-white border-2 border-transparent transition-all mb-4',
        isDragging && 'shadow-xl z-50 border-blue-500 scale-[1.02]'
      )}
    >
      {!disabled && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-[-2rem] top-4 p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-black hover:bg-black/5 rounded md:block hidden"
        >
          <GripVertical className="w-5 h-5" />
        </div>
      )}
      {children}
    </div>
  );
};
