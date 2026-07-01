import { useState } from 'react';
import { Card } from '../../../components/common/Card';
import { FilterSelect } from '../../../components/common/primitives';
import { FieldGrid, FormField, FormSection, TextInput } from '../../../components/form/FormPrimitives';
import { EVENT_TYPES, STATUSES, type EventType, type FY, type Status } from '../../../domain/constants';
import type { FyOverride, RequestValidationErrors } from '../../../domain/requestIntake';
import { theme } from '../../../styles/theme';

interface RequestBasicsSectionProps {
  complete: boolean;
  eventDate: string;
  resolvedFy: FY;
  status: Status;
  fyOverride: FyOverride;
  fyOptions: { value: string; label: string }[];
  eventId: string;
  eventTypes: EventType[];
  requestorEmail: string;
  errors: RequestValidationErrors;
  emailHint?: string;
  onEventDateChange: (value: string) => void;
  onStatusChange: (value: Status) => void;
  onFyOverrideChange: (value: FyOverride) => void;
  onEventIdChange: (value: string) => void;
  onEventTypesChange: (values: EventType[]) => void;
  onRequestorEmailChange: (value: string) => void;
}

function EventTypeDropdown({
  values,
  onChange,
  error,
}: {
  values: EventType[];
  onChange: (values: EventType[]) => void;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (type: EventType) => {
    onChange(values.includes(type) ? values.filter((value) => value !== type) : [...values, type]);
    setOpen(false);
  };

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: theme.radiusSm,
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) setOpen(false);
        }}
        style={{
          width: '100%',
          height: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          borderRadius: theme.radiusSm,
          border: `1px solid ${error ? theme.danger : theme.borderStrong}`,
          background: error ? theme.dangerBg : theme.surface,
          color: values.length ? theme.ink : theme.textTertiary,
          padding: '0 12px',
          fontSize: 12.5,
          fontWeight: 700,
          textAlign: 'left',
          transition: `all ${theme.transitionFast} ${theme.easing}`,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {values.length ? values.join(' + ') : 'Select event type'}
        </span>
        <span style={{ color: theme.textTertiary, fontSize: 12 }}>{open ? '^' : 'v'}</span>
      </button>

      {open && (
        <div
          tabIndex={-1}
          style={{
            position: 'absolute',
            zIndex: 20,
            top: 44,
            left: 0,
            right: 0,
            display: 'grid',
            gap: 6,
            padding: 8,
            borderRadius: theme.radiusSm,
            border: `1px solid ${theme.border}`,
            background: theme.surface,
            boxShadow: theme.shadowRaised,
          }}
        >
          {EVENT_TYPES.map((type) => {
            const selectedIndex = values.indexOf(type);
            const selected = selectedIndex >= 0;
            return (
              <button
                key={type}
                type="button"
                aria-pressed={selected}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggle(type)}
                style={{
                  minHeight: 36,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  borderRadius: 7,
                  border: `1px solid ${selected ? theme.info : theme.border}`,
                  background: selected ? '#eff6ff' : theme.surface,
                  color: selected ? '#1d4ed8' : theme.textSecondary,
                  padding: '7px 9px',
                  textAlign: 'left',
                  transition: `all ${theme.transitionFast} ${theme.easing}`,
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    border: `1.5px solid ${selected ? theme.info : theme.borderStrong}`,
                    background: selected ? theme.info : theme.surface,
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 900,
                    fontFamily: theme.mono,
                  }}
                >
                  {selected ? selectedIndex + 1 : ''}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 800 }}>{type}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function RequestBasicsSection({
  complete,
  eventDate,
  resolvedFy,
  status,
  fyOverride,
  fyOptions,
  eventId,
  eventTypes,
  requestorEmail,
  errors,
  emailHint,
  onEventDateChange,
  onStatusChange,
  onFyOverrideChange,
  onEventIdChange,
  onEventTypesChange,
  onRequestorEmailChange,
}: RequestBasicsSectionProps) {
  return (
    <Card>
      <FormSection title="Event basics" complete={complete}>
        <FieldGrid>
          <FormField label="Event date" required error={errors.eventDate}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TextInput
                type="date"
                value={eventDate}
                onChange={onEventDateChange}
                error={!!errors.eventDate}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: theme.mono,
                  color: theme.textSecondary,
                  whiteSpace: 'nowrap',
                  padding: '6px 10px',
                  background: theme.surfaceMuted,
                  borderRadius: 6,
                  border: `1px solid ${theme.border}`,
                }}
              >
                FY: {resolvedFy}
              </span>
            </div>
          </FormField>

          <FormField label="Status">
            <FilterSelect
              value={status}
              onChange={(value) => onStatusChange(value as Status)}
              options={STATUSES.map((item) => ({ value: item, label: item }))}
              style={{ width: '100%' }}
            />
          </FormField>

          <FormField label="Fiscal year override">
            <FilterSelect
              value={fyOverride}
              onChange={(value) => onFyOverrideChange(value as FyOverride)}
              options={fyOptions}
              style={{ width: '100%' }}
            />
          </FormField>

          <FormField label="Event ID" required error={errors.eventId}>
            <TextInput value={eventId} onChange={onEventIdChange} error={!!errors.eventId} />
          </FormField>

          <FormField label="Event type" required error={errors.eventType}>
            <EventTypeDropdown
              values={eventTypes}
              onChange={onEventTypesChange}
              error={!!errors.eventType}
            />
          </FormField>

          <FormField label="Requestor email" required error={errors.requestorEmail} hint={emailHint}>
            <TextInput
              type="email"
              value={requestorEmail}
              onChange={onRequestorEmailChange}
              placeholder="name@amcor.com"
              error={!!errors.requestorEmail}
            />
          </FormField>
        </FieldGrid>
      </FormSection>
    </Card>
  );
}
