import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface FeatureGuideProps {
  title?: string;
  description: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export function FeatureGuide({
  title,
  description,
  side = "top",
  className,
}: FeatureGuideProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center justify-center rounded-full text-amber-500 hover:text-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2",
            className
          )}
          aria-label="More information"
        >
          <Info className="h-5 w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side={side} className="max-w-[250px] p-4 text-sm">
        {title && <div className="font-semibold mb-1 text-amber-700 dark:text-amber-400">{title}</div>}
        <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {description}
        </div>
      </PopoverContent>
    </Popover>
  );
}
