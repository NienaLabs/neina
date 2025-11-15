import { Textarea } from '@/components/ui/textarea';
import { ResumeExtraction, Fixes } from './types';
import { FixesDisplay } from './FixesDisplay';

interface ProfileSectionProps {
  profile: ResumeExtraction['profile'];
  objective: ResumeExtraction['objective'];
  handleFieldChange: (section: keyof ResumeExtraction, value: unknown) => void;
  fixes: Fixes;
}

/**
 * Component for editing the profile and objective sections of a resume.
 * @param profile - The profile summary.
 * @param objective - The career objective.
 * @param handleFieldChange - Function to handle changes to the fields.
 * @param fixes - The fixes object for displaying hints.
 * @returns A section component for profile and objective.
 */
export const ProfileSection = ({
  profile,
  objective,
  handleFieldChange,
  fixes,
}: ProfileSectionProps) => {
  return (
    <>
      {profile && (
        <section>
          <div className="flex flex-row gap-2 items-center">
            <h2 className="text-xl font-semibold mb-3">Profile</h2>
            <div className="p-1 mb-3 flex items-center justify-center">
              <FixesDisplay fixes={fixes} section="profile" />
            </div>
          </div>
          <Textarea
            rows={4}
            value={profile}
            onChange={(e) => handleFieldChange('profile', e.target.value)}
          />
        </section>
      )}
      {objective && (
        <section>
          <div className="flex flex-row gap-2 items-center">
            <h2 className="text-xl font-semibold mb-3">Objective</h2>
            <div className="p-1 mb-3 flex items-center justify-center">
              <FixesDisplay fixes={fixes} section="objective" />
            </div>
          </div>
          <Textarea
            rows={3}
            value={objective}
            onChange={(e) => handleFieldChange('objective', e.target.value)}
          />
        </section>
      )}
    </>
  );
};
