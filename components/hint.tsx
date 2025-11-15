import React from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

type Side = 'top' | 'right' | 'bottom' | 'left'

interface HintProps {
  children: React.ReactNode
  hint: string | React.ReactNode
  side?: Side
}

const Hint: React.FC<HintProps> = ({ children, hint, side = 'top' }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={side}
        className="w-96 max-h-[60vh] p-0 overflow-hidden"
      >
        <ScrollArea className="h-full">
          <div className="p-4">{hint}</div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

export default Hint
