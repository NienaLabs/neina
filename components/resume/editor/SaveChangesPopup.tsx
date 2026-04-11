import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group';
import { cn } from '@/lib/utils';
import { Loader2, RotateCcw } from 'lucide-react';

interface SaveChangesPopupProps {
  save: boolean;
  onSave: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  onUndo: () => void;
  canUndo: boolean;
}

/**
 * Displays a popup asking the user to save changes.
 * @param save - Boolean indicating if the popup should be visible.
 * @param onSave - Callback function when save is clicked.
 * @param onCancel - Callback function when cancel is clicked.
 * @param isLoading - Boolean indicating if save operation is in progress.
 * @returns A popup component for saving changes.
 */
export const SaveChangesPopup = ({ save, onSave, onCancel, isLoading, onUndo, canUndo }: SaveChangesPopupProps) => {
  return (
    <div className={cn(
      "hidden flex-row gap-3 fixed transition-all duration-300 bg-amber-50 border border-amber-200 soft-glow bottom-8 place-self-center p-5 rounded-2xl z-100 items-center text-sm font-medium",
      save ? "flex animate-in slide-in-from-bottom-4 fade-in" : ""
    )}>
      <span className="text-amber-900">Do you want to save the changes?</span>
      <ButtonGroup>
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={onUndo} 
            disabled={!canUndo || isLoading}
            className="text-muted-foreground hover:text-foreground"
            title="Undo last change"
        >
            <RotateCcw className="h-4 w-4" />
        </Button>
        <ButtonGroupSeparator />
        <Button variant="ghost" onClick={onSave} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
        <ButtonGroupSeparator />
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </ButtonGroup>
    </div>
  );
};
