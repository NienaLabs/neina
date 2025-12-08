import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SaveChangesPopupProps {
  save: boolean;
  onSave: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Displays a popup asking the user to save changes.
 * @param save - Boolean indicating if the popup should be visible.
 * @param onSave - Callback function when save is clicked.
 * @param onCancel - Callback function when cancel is clicked.
 * @param isLoading - Boolean indicating if save operation is in progress.
 * @returns A popup component for saving changes.
 */
export const SaveChangesPopup = ({ save, onSave, onCancel, isLoading }: SaveChangesPopupProps) => {
  return (
    <div className={cn("hidden flex-row gap-2 fixed transition-all bg-background bottom-5 place-self-center p-2 rounded-lg z-10 items-center", save ? "flex" : "")}>
      Do you want to save the changes?
      <ButtonGroup>
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
