import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { ResumeExtraction, Fixes } from './types';
import { FixesDisplay } from './FixesDisplay';

interface PublicationsSectionProps {
  publications: NonNullable<ResumeExtraction['publications']>;
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
 * Component for editing the publications section of a resume.
 * @param publications - The publications data.
 * @param handleArrayAdd - Function to add a new publication entry.
 * @param handleArrayDelete - Function to delete a publication entry.
 * @param handleNestedFieldChange - Function to handle changes to nested fields.
 * @param fixes - The fixes object for displaying hints.
 * @returns A section component for publications.
 */
export const PublicationsSection = ({
  publications,
  handleArrayAdd,
  handleArrayDelete,
  handleNestedFieldChange,
  fixes,
}: PublicationsSectionProps) => {
  return (
    <section>
      <div className="text-xl font-semibold mb-3 flex items-center justify-between">
        <div className="flex flex-row gap-2 items-center">
          <h2 className="text-xl font-semibold mb-3">Publications</h2>
          <div className="p-1 mb-3 flex items-center justify-center">
            <FixesDisplay fixes={fixes} section="publications" />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            handleArrayAdd('publications', {
              title: '',
              publisher: '',
              date: '',
              link: '',
            })
          }
        >
          <Plus className="w-4 h-4 mr-2" /> Add Publication
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {publications.map((pub, index) => (
          <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => handleArrayDelete('publications', index)}
            >
              <Trash2 className="size-4 text-red-500" />
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Title"
                value={pub.title}
                onChange={(e) =>
                  handleNestedFieldChange('publications', index, 'title', e.target.value)
                }
              />
              <Input
                placeholder="Publisher"
                value={pub.publisher}
                onChange={(e) =>
                  handleNestedFieldChange('publications', index, 'publisher', e.target.value)
                }
              />
              <Input
                placeholder="Date"
                value={pub.date}
                onChange={(e) =>
                  handleNestedFieldChange('publications', index, 'date', e.target.value)
                }
              />
              <Input
                placeholder="Link"
                value={pub.link}
                onChange={(e) =>
                  handleNestedFieldChange('publications', index, 'link', e.target.value)
                }
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
