import { useState } from 'react';
import { theme } from '../../styles/theme';
import { Card } from '../common/Card';
import { SegmentedControl } from '../common/primitives';
import { LearningTab } from './LearningTab';
import { TemplatesTab } from './TemplatesTab';

type LibrarySection = 'templates' | 'learning';

const SECTION_OPTIONS: { value: LibrarySection; label: string }[] = [
  { value: 'templates', label: 'Templates' },
  { value: 'learning', label: 'Learning' },
];

export function TemplatesLearningTab() {
  const [section, setSection] = useState<LibrarySection>('templates');

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card pad={18}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 240 }}>
            <div style={{ fontSize: 18, fontWeight: 850, color: theme.ink, letterSpacing: 0 }}>
              Templates &amp; Learning
            </div>
            <div style={{ marginTop: 4, color: theme.textSecondary, fontSize: 12.5, lineHeight: 1.45 }}>
              RFI/RFQ starter kits and eSourcing enablement material.
            </div>
          </div>
          <SegmentedControl options={SECTION_OPTIONS} value={section} onChange={setSection} />
        </div>
      </Card>

      {section === 'templates' ? <TemplatesTab /> : <LearningTab />}
    </div>
  );
}
