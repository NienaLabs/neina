import React from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

type side = "top" | "right" | "bottom" | "left"

const Hint = ({children,hint,side="top"}:{children:React.ReactNode,hint:string | React.ReactNode,side?:side}) => {
  return (
    <Tooltip>
        <TooltipTrigger>
            {children}
        </TooltipTrigger>
        <TooltipContent side={side}>
            <span>
              {hint}
            </span>
        </TooltipContent>
    </Tooltip>
  )
}

export default Hint