import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { ResumeExtraction, Fixes } from './types';
import { FixesDisplay } from './FixesDisplay';

interface AwardsSectionProps {
  awards: NonNullable<ResumeExtraction['awards']>;
  handleArrayAdd: (section: keyof ResumeExtraction, newItem: unknown) => void;
  handleArrayDelete: (section: keyof ResumeExtraction, index: number) => void;
  handleNestedFieldChange: (
    section: keyof ResumeExtraction,
    index: number,
    key: string,
    value: unknown
  ) => void;
  fixes: Fixes;
}

/**
 * Component for editing the awards section of a resume.
 * @param awards - The awards data.
 * @param handleArrayAdd - Function to add a new award entry.
 * @param handleArrayDelete - Function to delete an award entry.
 * @param handleNestedFieldChange - Function to handle changes to nested fields.
 * @param fixes - The fixes object for displaying hints.
 * @returns A section component for awards.
 */
export const AwardsSection = ({
  awards,
  handleArrayAdd,
  handleArrayDelete,
  handleNestedFieldChange,
  fixes,
}: AwardsSectionProps) => {
  return (
    <section>
      <div className="text-xl font-semibold mb-3 flex items-center justify-between">
        <div className="flex flex-row gap-2 items-center">
          <h2 className="text-xl font-semibold mb-3">Awards</h2>
          <div className="p-1 mb-3 flex items-center justify-center">
            <FixesDisplay fixes={fixes} section="awards" />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            handleArrayAdd('awards', {
              title: '',
              issuer: '',
              year: '',
            })
          }
        >
          <Plus className="w-4 h-4 mr-2" /> Add Award
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {awards.map((award, index) => (
          <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => handleArrayDelete('awards', index)}
            >
              <Trash2 className="size-4 text-red-500" />
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Title"
                value={award.title}
                onChange={(e) =>
                  handleNestedFieldChange('awards', index, 'title', e.target.value)
                }
              />
              <Input
                placeholder="Issuer"
                value={award.issuer}
                onChange={(e) =>
                  handleNestedFieldChange('awards', index, 'issuer', e.target.value)
                }
              />
              <Input
                placeholder="Year"
                value={award.year}
                onChange={(e) =>
                  handleNestedFieldChange('awards', index, 'year', e.target.value)
                }
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
