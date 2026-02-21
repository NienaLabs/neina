import { Badge } from '@/components/ui/badge';
import Hint from '@/components/hint';
import { Info, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Fix, Fixes } from './types';
import gsap from 'gsap';
import { useRef } from 'react';

interface FixesDisplayProps {
  fixes: Fixes;
  section: string;
  onApplyFix?: (fix: Fix) => void;
}

export const FixesDisplay = ({ fixes, section, onApplyFix }: FixesDisplayProps) => {
  // Non-custom sections
  if (section !== 'customSections') {
    const sectionFixes = (fixes?.[section] as Fix[]) || [];
    if (!sectionFixes.length) return null;

    let issue = '';
    let suggestion = '';
    sectionFixes.forEach((fix) => {
      issue += `\n${fix.severity}: ${fix.issue}`;
      suggestion += `\n${fix.suggestion}`;
    });

    const autoFixable = sectionFixes.find((f) => f.autoFix);
    
    return (
      <div className="flex items-center my-2 justify-between">
        <Hint
          hint={
            <div className="max-h-80 overflow-auto p-2 space-y-2 text-sm">
              <div>
                <Badge variant="destructive">Issues</Badge>
                <pre className="whitespace-pre-wrap">{issue}</pre>
              </div>
              <div>
                <Badge>Suggestions</Badge>
                <pre className="whitespace-pre-wrap">{suggestion}</pre>
              </div>
            </div>
          }
        >
          <Badge className="flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200">
            {sectionFixes.length} {sectionFixes.length === 1 ? 'issue' : 'issues'} <Info className="size-3.5" />
          </Badge>
        </Hint>
        {onApplyFix && autoFixable && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-3 text-xs font-medium text-green-700 bg-green-50 hover:text-green-800 hover:bg-green-100 border border-green-300 rounded-lg"
            onClick={(e) => {
                const target = e.currentTarget;
                gsap.to(target, {
                    scale: 0.9,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1,
                    onComplete: () => onApplyFix(autoFixable)
                });
            }}
          >
            <Wand2 className="size-3 mr-1" /> Auto Fix
          </Button>
        )}
      </div>
    );
  }

  // Custom sections
  const customFixes = (fixes?.customSections as Record<string, Fix[]>) || {};
  if (Object.keys(customFixes).length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(customFixes).map(([sectionName, entries]) => {
        if (!entries || !entries.length) return null;

        let customIssue = '';
        let customSuggestion = '';
        entries.forEach((fix) => {
          customIssue += `\n${fix.severity}: ${fix.issue}`;
          customSuggestion += `\n${fix.suggestion}`;
        });

        return (
          <Hint
            key={sectionName}
            hint={
              <div className="max-h-80 overflow-auto p-2 space-y-2 text-sm">
                <Badge variant="outline" className="bg-gray-200 text-black">
                  {sectionName}
                </Badge>
                <div>
                  <Badge variant="destructive">Issues</Badge>
                  <pre className="whitespace-pre-wrap">{customIssue}</pre>
                </div>
                <div>
                  <Badge>Suggestions</Badge>
                  <pre className="whitespace-pre-wrap">{customSuggestion}</pre>
                </div>
              </div>
            }
          >
            <Badge className="flex items-center gap-1">
              {sectionName} <Info className="size-4" />
            </Badge>
          </Hint>
        );
      })}
    </div>
  );
};
