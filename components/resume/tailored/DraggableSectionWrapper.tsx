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
        'relative bg-white border-none rounded-2xl soft-glow transition-all mb-4',
        isDragging && 'z-50 scale-[1.02] ring-2 ring-primary-purple'
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
