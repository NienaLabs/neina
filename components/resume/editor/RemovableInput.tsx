import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RemovableInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onRemove: () => void;
  containerClassName?: string;
}

export const RemovableInput = ({
  className,
  containerClassName,
  onRemove,
  ...props
}: RemovableInputProps) => {
  return (
    <div className={cn("relative flex items-center gap-2", containerClassName)}>
      <Input className={cn("pr-10", className)} {...props} />
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        tabIndex={-1}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
};
