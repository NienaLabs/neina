'use client';

import React from 'react';
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
  return (
    <div
      data-id={id}
      className={cn(
        'relative bg-white border-none rounded-2xl soft-glow transition-all mb-4',
        // Dragula uses gu-mirror for the dragging item, we can style it here if needed
        // but typically Dragula handles the clone. We just need a static base.
      )}
    >
      {!disabled && (
        <div
          className="drag-handle absolute left-[-2rem] top-6 p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-black hover:bg-black/5 rounded md:block hidden"
        >
          <GripVertical className="w-5 h-5 pointer-events-none" />
        </div>
      )}
      <div className="p-5 md:p-6">
        {children}
      </div>
    </div>
  );
};
