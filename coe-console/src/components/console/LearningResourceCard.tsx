import type { LearningResource, LearningResourceType, LearningTopic } from '../../domain/templateTypes';
import { theme } from '../../styles/theme';
import { Card } from '../common/Card';
import { IconBookOpen, IconClock, IconExternal, IconFileText, IconHelpCircle, IconVideo } from './icons';

const TOPIC_COLORS: Record<LearningTopic, string> = {
  'eSourcing Fundamentals': theme.primary,
  Archlet: theme.green,
  'RFx Process': theme.info,
  Negotiation: theme.warning,
  'CoE Governance': theme.chart5,
};

function typeLabel(type: LearningResourceType): string {
  if (type === 'quickref') return 'Quick ref';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function ResourceIcon({ type }: { type: LearningResourceType }) {
  if (type === 'video') return <IconVideo size={17} color={theme.info} />;
  if (type === 'faq') return <IconHelpCircle size={17} color={theme.chart5} />;
  if (type === 'quickref') return <IconFileText size={17} color={theme.warning} />;
  return <IconBookOpen size={17} color={theme.primary} />;
}

export function LearningResourceCard({ resource }: { resource: LearningResource }) {
  const topicColor = TOPIC_COLORS[resource.topic];

  return (
    <Card className="library-card" pad={16}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 8px',
                borderRadius: 6,
                border: `1px solid ${topicColor}55`,
                color: topicColor,
                background: `${topicColor}14`,
                fontSize: 11,
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 2, background: topicColor, flexShrink: 0 }} />
              {resource.topic}
            </span>
            <span
              style={{
                color: theme.textSecondary,
                background: theme.surfaceMuted,
                border: `1px solid ${theme.border}`,
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 11,
                fontWeight: 800,
                fontFamily: theme.mono,
                lineHeight: 1.2,
              }}
            >
              {typeLabel(resource.type)}
            </span>
          </div>

          <h3
            style={{
              margin: 0,
              fontSize: 16,
              lineHeight: 1.25,
              color: theme.ink,
              fontWeight: 850,
              letterSpacing: 0,
            }}
          >
            {resource.title}
          </h3>
        </div>

        <span
          aria-label={`${typeLabel(resource.type)} resource`}
          style={{
            width: 34,
            height: 34,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: theme.surfaceRaised,
            flexShrink: 0,
          }}
        >
          <ResourceIcon type={resource.type} />
        </span>
      </div>

      <p style={{ margin: '12px 0 0', color: theme.textSecondary, fontSize: 12.5, lineHeight: 1.5 }}>
        {resource.description}
      </p>

      <div
        style={{
          marginTop: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {resource.estimatedMinutes && (
            <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center', color: theme.textSecondary, fontSize: 11.5 }}>
              <IconClock size={13} color={theme.textTertiary} />
              {resource.estimatedMinutes} min
            </span>
          )}
          <span style={{ color: theme.textTertiary, fontSize: 11.5, fontFamily: theme.mono }}>
            Updated {formatDate(resource.lastUpdated)}
          </span>
        </div>

        <a
          href={resource.resourceUrl}
          className="ui-btn ui-btn--secondary"
          aria-label={`View ${resource.title}`}
          style={{ textDecoration: 'none', height: 34, padding: '7px 12px', fontSize: 12.5 }}
        >
          <IconExternal size={14} color={theme.textSecondary} />
          View
        </a>
      </div>
    </Card>
  );
}
