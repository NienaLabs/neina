import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group';
import { cn } from '@/lib/utils';

interface SaveChangesPopupProps {
  save: boolean;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Displays a popup asking the user to save changes.
 * @param save - Boolean indicating if the popup should be visible.
 * @param onSave - Callback function when save is clicked.
 * @param onCancel - Callback function when cancel is clicked.
 * @returns A popup component for saving changes.
 */
export const SaveChangesPopup = ({ save, onSave, onCancel }: SaveChangesPopupProps) => {
  return (
    <div className={cn("hidden flex-row gap-2 fixed transition-all bg-background bottom-5 place-self-center p-2 rounded-lg z-10 items-center", save ? "flex" : "")}>
      Do you want to save the changes?
      <ButtonGroup>
        <Button variant="ghost" onClick={onSave}>
          Save
        </Button>
        <ButtonGroupSeparator />
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </ButtonGroup>
    </div>
  );
};
