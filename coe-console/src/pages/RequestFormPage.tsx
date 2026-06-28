import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button, FilterSelect, SegmentedControl } from '../components/common/primitives';
import {
  AssessmentFlag,
  DropZone,
  FieldGrid,
  FormField,
  FormSection,
  NumberInput,
  SummaryRow,
  TextInput,
} from '../components/form/FormPrimitives';
import { CATEGORIES, CATEGORY_BY_NAME } from '../domain/categories';
import {
  EVENT_TYPES,
  FYS,
  REGION_LABEL,
  REGIONS,
  STATUSES,
  type EventType,
  type FY,
  type Region,
  type Status,
} from '../domain/constants';
import {
  deriveStatusFromDate,
  generateNextEventId,
  getFiscalYearFromDate,
  isValidEmail,
  prefersAmcorEmail,
} from '../domain/eventFormHelpers';
import { fmtUSD } from '../domain/selectors';
import { useStore } from '../domain/store';
import { useSession } from '../domain/session';
import { theme, numeric, sectionLabel } from '../styles/theme';

type FyOverride = 'auto' | FY;
type GroupMode = 'single' | 'multiple';
type Directness = 'Direct' | 'Indirect';

interface BusinessGroupRow {
  key: string;
  region: Region;
  spend: number;
}

type DocType = 'Bid Template' | 'RFI Questionnaire' | 'Supplier List' | 'Specification' | 'Other';

interface AttachmentRow {
  key: string;
  docType: DocType;
  file: File;
}

interface RequestDraft {
  eventDate: string;
  status: Status;
  statusTouched: boolean;
  fyOverride: FyOverride;
  eventId: string;
  eventIdTouched: boolean;
  eventTypes: EventType[];
  requestorEmail: string;
  groupMode: GroupMode;
  groupRows: BusinessGroupRow[];
  directness: Directness;
  category: string;
  subcategory: string;
  shouldCostModeling: boolean;
  riskAssessment: boolean;
  esgAssessment: boolean;
  docType: DocType;
  savedAt: string;
}

const DOC_TYPES: DocType[] = [
  'Bid Template',
  'RFI Questionnaire',
  'Supplier List',
  'Specification',
  'Other',
];

const REQUEST_DRAFT_KEY = 'coe-console:new-event-request:draft';

function todayIso() {
  const today = new Date();
  const tzOffset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - tzOffset).toISOString().slice(0, 10);
}

const DEFAULT_DATE = todayIso();
let rowKey = 0;
function nextKey() {
  return `row-${++rowKey}`;
}

function fmtDraftSavedAt(iso: string | null) {
  if (!iso) return 'Not saved yet';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Draft saved';
  return `Draft saved ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
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

export function RequestFormPage() {
  const navigate = useNavigate();
  const events = useStore((s) => s.events);
  const addEvent = useStore((s) => s.addEvent);
  const sessionUser = useSession((s) => s.user);

  const [eventDate, setEventDate] = useState(DEFAULT_DATE);
  const [status, setStatus] = useState<Status>(() => deriveStatusFromDate(DEFAULT_DATE));
  const [statusTouched, setStatusTouched] = useState(false);
  const [fyOverride, setFyOverride] = useState<FyOverride>('auto');
  const [eventId, setEventId] = useState(() =>
    generateNextEventId(getFiscalYearFromDate(DEFAULT_DATE), useStore.getState().events),
  );
  const [eventIdTouched, setEventIdTouched] = useState(false);
  const [eventTypes, setEventTypes] = useState<EventType[]>(['Reverse Auction']);
  const [requestorEmail, setRequestorEmail] = useState(sessionUser?.email ?? '');

  const [groupMode, setGroupMode] = useState<GroupMode>('multiple');
  const [groupRows, setGroupRows] = useState<BusinessGroupRow[]>([
    { key: nextKey(), region: 'NA', spend: 0 },
    { key: nextKey(), region: 'EMEA', spend: 0 },
    { key: nextKey(), region: 'APAC', spend: 0 },
  ]);

  const [directness, setDirectness] = useState<Directness>('Direct');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');

  const [shouldCostModeling, setShouldCostModeling] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState(false);
  const [esgAssessment, setEsgAssessment] = useState(false);

  const [docType, setDocType] = useState<DocType>('Bid Template');
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [emailHint, setEmailHint] = useState<string | undefined>();
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  const autoFy = useMemo(() => getFiscalYearFromDate(eventDate), [eventDate]);
  const resolvedFy: FY = fyOverride === 'auto' ? autoFy : fyOverride;

  const visibleRows = groupMode === 'single' ? groupRows.slice(0, 1) : groupRows;
  const totalSpend = visibleRows.reduce((sum, r) => sum + (r.spend || 0), 0);
  const groupsWithSpend = visibleRows.filter((r) => r.spend > 0).length;

  const subcategoryOptions = category ? CATEGORY_BY_NAME[category]?.subcategories ?? [] : [];

  const assessmentFlags = [
    shouldCostModeling && 'Should Cost',
    riskAssessment && 'Risk',
    esgAssessment && 'ESG',
  ].filter(Boolean) as string[];

  const basicsComplete = !!(eventDate && eventTypes.length && requestorEmail && isValidEmail(requestorEmail));
  const spendComplete = groupsWithSpend > 0;
  const categoryComplete = !!category && !!subcategory;
  const dashboardImpact = [
    { label: 'Pipeline', value: `${groupsWithSpend || 0} event${groupsWithSpend === 1 ? '' : 's'}` },
    { label: 'Sourced', value: fmtUSD(totalSpend) },
  ];

  useEffect(() => {
    if (!statusTouched) setStatus(deriveStatusFromDate(eventDate));
  }, [eventDate, statusTouched]);

  useEffect(() => {
    if (!eventIdTouched) {
      setEventId(generateNextEventId(resolvedFy, events));
    }
  }, [resolvedFy, events, eventIdTouched]);

  useEffect(() => {
    const raw = window.localStorage.getItem(REQUEST_DRAFT_KEY);
    if (!raw) {
      setDraftLoaded(true);
      return;
    }

    try {
      const draft = JSON.parse(raw) as Partial<RequestDraft>;
      if (draft.eventDate) setEventDate(draft.eventDate);
      if (draft.status && STATUSES.includes(draft.status)) setStatus(draft.status);
      if (typeof draft.statusTouched === 'boolean') setStatusTouched(draft.statusTouched);
      if (draft.fyOverride && (draft.fyOverride === 'auto' || FYS.includes(draft.fyOverride))) {
        setFyOverride(draft.fyOverride);
      }
      if (draft.eventId) setEventId(draft.eventId);
      if (typeof draft.eventIdTouched === 'boolean') setEventIdTouched(draft.eventIdTouched);
      if (Array.isArray(draft.eventTypes) && draft.eventTypes.length) {
        setEventTypes(draft.eventTypes.filter((type): type is EventType => EVENT_TYPES.includes(type)));
      }
      if (draft.requestorEmail) setRequestorEmail(draft.requestorEmail);
      if (draft.groupMode === 'single' || draft.groupMode === 'multiple') setGroupMode(draft.groupMode);
      if (Array.isArray(draft.groupRows) && draft.groupRows.length) {
        setGroupRows(
          draft.groupRows
            .filter((row) => REGIONS.includes(row.region))
            .map((row) => ({ key: row.key || nextKey(), region: row.region, spend: Number(row.spend) || 0 })),
        );
      }
      if (draft.directness === 'Direct' || draft.directness === 'Indirect') setDirectness(draft.directness);
      if (draft.category && CATEGORY_BY_NAME[draft.category]) setCategory(draft.category);
      if (draft.subcategory) setSubcategory(draft.subcategory);
      if (typeof draft.shouldCostModeling === 'boolean') setShouldCostModeling(draft.shouldCostModeling);
      if (typeof draft.riskAssessment === 'boolean') setRiskAssessment(draft.riskAssessment);
      if (typeof draft.esgAssessment === 'boolean') setEsgAssessment(draft.esgAssessment);
      if (draft.docType && DOC_TYPES.includes(draft.docType)) setDocType(draft.docType);
      setDraftSavedAt(draft.savedAt ?? null);
      setDraftRestored(true);
    } catch (err) {
      console.warn('[request-form] failed to restore draft', err);
      window.localStorage.removeItem(REQUEST_DRAFT_KEY);
    } finally {
      setDraftLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!draftLoaded || saved) return;
    const handle = window.setTimeout(() => {
      const savedAt = new Date().toISOString();
      const draft: RequestDraft = {
        eventDate,
        status,
        statusTouched,
        fyOverride,
        eventId,
        eventIdTouched,
        eventTypes,
        requestorEmail,
        groupMode,
        groupRows,
        directness,
        category,
        subcategory,
        shouldCostModeling,
        riskAssessment,
        esgAssessment,
        docType,
        savedAt,
      };
      window.localStorage.setItem(REQUEST_DRAFT_KEY, JSON.stringify(draft));
      setDraftSavedAt(savedAt);
    }, 600);

    return () => window.clearTimeout(handle);
  }, [
    draftLoaded,
    saved,
    eventDate,
    status,
    statusTouched,
    fyOverride,
    eventId,
    eventIdTouched,
    eventTypes,
    requestorEmail,
    groupMode,
    groupRows,
    directness,
    category,
    subcategory,
    shouldCostModeling,
    riskAssessment,
    esgAssessment,
    docType,
  ]);

  const handleCategoryChange = useCallback((cat: string) => {
    setCategory(cat);
    setSubcategory(CATEGORY_BY_NAME[cat]?.subcategories[0] ?? '');
  }, []);

  const addGroupRow = () => {
    if (groupRows.length >= REGIONS.length) return;
    const used = new Set(groupRows.map((r) => r.region));
    const nextRegion = REGIONS.find((r) => !used.has(r)) ?? 'NA';
    setGroupRows((rows) => [...rows, { key: nextKey(), region: nextRegion, spend: 0 }]);
  };

  const removeGroupRow = (key: string) => {
    setGroupRows((rows) => rows.filter((r) => r.key !== key));
  };

  const updateGroupRow = (key: string, patch: Partial<BusinessGroupRow>) => {
    setGroupRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const handleFileSelect = (files: FileList) => {
    const added: AttachmentRow[] = Array.from(files).map((file) => ({
      key: nextKey(),
      docType,
      file,
    }));
    setAttachments((prev) => [...prev, ...added]);
  };

  const removeAttachment = (key: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.key !== key));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!eventDate) next.eventDate = 'Event date is required.';
    if (eventTypes.length === 0) next.eventType = 'Select at least one event type.';
    if (!requestorEmail.trim()) {
      next.requestorEmail = 'Requestor email is required.';
    } else if (!isValidEmail(requestorEmail)) {
      next.requestorEmail = 'Enter a valid email address.';
    }
    if (!category) next.category = 'Category is required.';
    if (!subcategory) next.subcategory = 'Subcategory is required.';

    const activeRows = groupMode === 'single' ? groupRows.slice(0, 1) : groupRows;
    const withSpend = activeRows.filter((r) => r.spend > 0);
    if (withSpend.length === 0) {
      next.spend = 'Enter spend greater than zero for at least one business group.';
    }
    const duplicateRegion = withSpend.find((row, index) => withSpend.some((other, i) => i !== index && other.region === row.region));
    if (duplicateRegion) next.spend = `${duplicateRegion.region} is entered more than once. Use one row per business group.`;
    if (!eventId.trim()) next.eventId = 'Event ID is required.';
    if (events.some((event) => event.id === eventId)) {
      next.eventId = 'Event ID already exists. Use a new ID or fiscal year.';
    }

    setErrors(next);
    if (!next.requestorEmail && requestorEmail && !prefersAmcorEmail(requestorEmail)) {
      setEmailHint('Prefer an @amcor.com address when available.');
    } else {
      setEmailHint(undefined);
    }

    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const activeRows = (groupMode === 'single' ? groupRows.slice(0, 1) : groupRows).filter(
      (r) => r.spend > 0,
    );
    const totalSpend = activeRows.reduce((s, r) => s + r.spend, 0);
    const regions = activeRows.map((r) => r.region) as Region[];
    const businessGroups = activeRows.map((r) => ({
      region: r.region,
      addressable: Math.round(r.spend),
      sourced: Math.round(r.spend),
    }));

    addEvent({
      id: eventId,
      name: `${category} - ${subcategory}`,
      fy: resolvedFy,
      category,
      subcategory,
      region: activeRows[0].region,
      regions,
      businessGroups,
      type: eventTypes[0],
      eventTypes,
      status,
      addressable: Math.round(totalSpend),
      sourced: Math.round(totalSpend),
      savings: 0,
      startDate: eventDate,
      requestor: requestorEmail.trim(),
      shouldCostModeling,
      riskAssessment,
      esgAssessment,
      directness,
      requestCreatedAt: new Date().toISOString(),
    });

    window.localStorage.removeItem(REQUEST_DRAFT_KEY);
    setDraftSavedAt(null);
    setDraftRestored(false);
    setSaved(true);
    window.setTimeout(() => navigate('/'), 600);
  };

  const fyOptions = [
    { value: 'auto', label: `Auto (${autoFy})` },
    ...FYS.map((fy) => ({ value: fy, label: fy })),
  ];
  const errorEntries = Object.entries(errors);

  const clearDraft = () => {
    window.localStorage.removeItem(REQUEST_DRAFT_KEY);
    setDraftSavedAt(null);
    setDraftRestored(false);
  };

  return (
    <div className="app-shell request-page">
      <header className="sticky-header">
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '0 20px',
            height: theme.headerH,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <Link to="/" className="ui-btn ui-btn--ghost" style={{ textDecoration: 'none', fontSize: 12.5 }}>
            Back to console
          </Link>
          <div style={{ width: 1, height: 20, background: theme.border }} aria-hidden />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.ink }}>New Event Request</div>
            <div style={{ fontSize: 11, color: theme.textSecondary }}>Log an eSourcing event</div>
          </div>
          <Button type="submit" form="event-form" variant="primary" disabled={saved}>
            Save event
          </Button>
        </div>
      </header>

      <div className="request-hero">
        <div>
          <div style={{ ...sectionLabel, color: theme.primary, marginBottom: 7 }}>Event intake</div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 850,
              letterSpacing: '-0.02em',
              color: theme.ink,
              lineHeight: 1.15,
            }}
          >
            Log an eSourcing event
          </h1>
          <p style={{ margin: '8px 0 0', maxWidth: 660, fontSize: 13.5, color: theme.textSecondary, lineHeight: 1.55 }}>
            Saved requests are persisted locally and feed the console, pipeline, event register, and sourced spend views.
          </p>
        </div>
        <div className="impact-strip" aria-label="Dashboard impact preview">
          {dashboardImpact.map((item) => (
            <div key={item.label} className="impact-tile">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

      {saved && (
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 20px 12px' }}>
          <div
            role="status"
            style={{
              padding: '10px 14px',
              borderRadius: theme.radiusSm,
              background: theme.successBg,
              border: `1px solid ${theme.success}40`,
              color: theme.success,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Event saved - returning to console...
          </div>
        </div>
      )}

      <form id="event-form" onSubmit={handleSubmit} noValidate className="form-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            role="status"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '10px 13px',
              borderRadius: theme.radiusSm,
              background: draftRestored ? theme.infoBg : theme.surfaceMuted,
              border: `1px solid ${draftRestored ? theme.info : theme.border}`,
              color: draftRestored ? theme.info : theme.textSecondary,
              fontSize: 12.5,
              fontWeight: 650,
              flexWrap: 'wrap',
            }}
          >
            <span>
              {draftRestored
                ? `${fmtDraftSavedAt(draftSavedAt)} - restored automatically`
                : fmtDraftSavedAt(draftSavedAt)}
            </span>
            {draftSavedAt && (
              <button
                type="button"
                onClick={clearDraft}
                className="ui-btn ui-btn--ghost"
                style={{ height: 26, padding: '4px 8px', fontSize: 11.5 }}
              >
                Clear draft
              </button>
            )}
          </div>

          {errorEntries.length > 0 && (
            <div
              role="alert"
              style={{
                padding: '11px 13px',
                borderRadius: theme.radiusSm,
                background: theme.dangerBg,
                border: `1px solid ${theme.danger}40`,
                color: theme.danger,
                fontSize: 12.5,
                lineHeight: 1.45,
              }}
            >
              <strong style={{ display: 'block', marginBottom: 4 }}>Please fix {errorEntries.length} field issue{errorEntries.length === 1 ? '' : 's'}.</strong>
              <span>{errorEntries.map(([, message]) => message).join(' ')}</span>
            </div>
          )}

          <Card>
            <FormSection title="Event basics" complete={basicsComplete}>
              <FieldGrid>
                <FormField label="Event date" required error={errors.eventDate}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <TextInput
                      type="date"
                      value={eventDate}
                      onChange={setEventDate}
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
                    onChange={(v) => {
                      setStatus(v as Status);
                      setStatusTouched(true);
                    }}
                    options={STATUSES.map((s) => ({ value: s, label: s }))}
                    style={{ width: '100%' }}
                  />
                </FormField>

                <FormField label="Fiscal year override">
                  <FilterSelect
                    value={fyOverride}
                    onChange={(v) => setFyOverride(v as FyOverride)}
                    options={fyOptions}
                    style={{ width: '100%' }}
                  />
                </FormField>

                <FormField label="Event ID" required error={errors.eventId}>
                  <TextInput
                    value={eventId}
                    onChange={(v) => {
                      setEventId(v);
                      setEventIdTouched(true);
                    }}
                    error={!!errors.eventId}
                  />
                </FormField>

                <FormField label="Event type" required error={errors.eventType}>
                  <EventTypeDropdown
                    values={eventTypes}
                    onChange={setEventTypes}
                    error={!!errors.eventType}
                  />
                </FormField>

                <FormField
                  label="Requestor email"
                  required
                  error={errors.requestorEmail}
                  hint={emailHint}
                >
                  <TextInput
                    type="email"
                    value={requestorEmail}
                    onChange={setRequestorEmail}
                    placeholder="name@amcor.com"
                    error={!!errors.requestorEmail}
                  />
                </FormField>
              </FieldGrid>
            </FormSection>
          </Card>

          <Card>
            <FormSection title="Business groups & spend" complete={spendComplete}>
              <SegmentedControl
                options={[
                  { value: 'single' as GroupMode, label: 'Single group' },
                  { value: 'multiple' as GroupMode, label: 'Multiple groups' },
                ]}
                value={groupMode}
                onChange={setGroupMode}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {visibleRows.map((row) => (
                  <div
                    key={row.key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        groupMode === 'multiple' && visibleRows.length > 1
                          ? '1fr 1fr auto'
                          : '1fr 1fr',
                      gap: 10,
                      alignItems: 'end',
                    }}
                  >
                    <FormField label="Business group">
                      <FilterSelect
                        value={row.region}
                        onChange={(v) => updateGroupRow(row.key, { region: v as Region })}
                        options={REGIONS.map((r) => ({ value: r, label: `${r} - ${REGION_LABEL[r]}` }))}
                        style={{ width: '100%' }}
                      />
                    </FormField>
                    <FormField label="Spend ($)">
                      <NumberInput
                        value={row.spend}
                        onChange={(v) => updateGroupRow(row.key, { spend: v })}
                        min={0}
                        step={1000}
                        error={!!errors.spend}
                      />
                    </FormField>
                    {groupMode === 'multiple' && visibleRows.length > 1 && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => removeGroupRow(row.key)}
                        style={{
                          height: 38,
                          marginBottom: errors.spend ? 24 : 0,
                          fontSize: 12,
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {errors.spend && (
                <span style={{ fontSize: 12, color: theme.danger, fontWeight: 500 }} role="alert">
                  {errors.spend}
                </span>
              )}

              {groupMode === 'multiple' && (
                <button
                  type="button"
                  onClick={addGroupRow}
                  disabled={groupRows.length >= REGIONS.length}
                  className="ui-btn ui-btn--ghost"
                  style={{
                    alignSelf: 'flex-start',
                    border: `1px dashed ${theme.borderStrong}`,
                    fontSize: 12.5,
                    color: theme.primary,
                  }}
                >
                  {groupRows.length >= REGIONS.length ? 'All business groups added' : '+ Add business group'}
                </button>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '11px 14px',
                  background: theme.surfaceMuted,
                  borderRadius: theme.radiusSm,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <span style={{ fontSize: 12.5, fontWeight: 600, color: theme.textSecondary }}>
                  Total addressable spend
                </span>
                <span style={{ fontSize: 15, fontWeight: 800, color: theme.ink, ...numeric }}>
                  {fmtUSD(totalSpend)}
                </span>
              </div>
            </FormSection>
          </Card>

          <Card>
            <FormSection title="Category & effectiveness" complete={categoryComplete}>
              <FieldGrid>
                <FormField label="Direct / Indirect" required>
                  <SegmentedControl
                    options={[
                      { value: 'Direct' as Directness, label: 'Direct' },
                      { value: 'Indirect' as Directness, label: 'Indirect' },
                    ]}
                    value={directness}
                    onChange={setDirectness}
                    fullWidth
                  />
                </FormField>

                <FormField label="Category" required error={errors.category}>
                  <FilterSelect
                    value={category}
                    onChange={handleCategoryChange}
                    placeholder="Select..."
                    options={CATEGORIES.map((c) => ({ value: c.name, label: c.name }))}
                    style={{ width: '100%' }}
                  />
                </FormField>

                <FormField label="Subcategory" required error={errors.subcategory}>
                  <FilterSelect
                    value={subcategory}
                    onChange={setSubcategory}
                    placeholder={category ? 'Select...' : 'Choose category first'}
                    disabled={!category}
                    options={subcategoryOptions.map((s) => ({ value: s, label: s }))}
                    style={{ width: '100%' }}
                  />
                </FormField>

              </FieldGrid>
            </FormSection>
          </Card>

          <Card>
            <FormSection title="Assessment flags">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <AssessmentFlag
                  checked={shouldCostModeling}
                  onChange={setShouldCostModeling}
                  label="Yes, I would like Should Cost modelling support for this event"
                  description="The CoE will build a cost breakdown model to establish an independent price anchor before the event. The flag follows the event into the register."
                />
                <AssessmentFlag
                  checked={riskAssessment}
                  onChange={setRiskAssessment}
                  label="Yes, request a supplier & supply-risk assessment for this event"
                  description="The CoE will screen financial health, geographic exposure, single-source dependency and continuity risk before award."
                />
                <AssessmentFlag
                  checked={esgAssessment}
                  onChange={setEsgAssessment}
                  label="Yes, request an ESG assessment for this event"
                  description="The CoE will screen suppliers on emissions, labour, human-rights and governance criteria for the award recommendation."
                />
              </div>
            </FormSection>
          </Card>

          <Card>
            <FormSection title="Attachments" description="bid template, RFI questionnaire">
              <FieldGrid>
                <FormField label="Document type">
                  <FilterSelect
                    value={docType}
                    onChange={(v) => setDocType(v as DocType)}
                    options={DOC_TYPES.map((d) => ({ value: d, label: d }))}
                    style={{ width: '100%' }}
                  />
                </FormField>
              </FieldGrid>

              <DropZone onFiles={handleFileSelect} />

              {attachments.length > 0 && (
                <ul
                  style={{
                    margin: '12px 0 0',
                    padding: 0,
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {attachments.map((a) => (
                    <li
                      key={a.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        background: theme.surfaceMuted,
                        borderRadius: theme.radiusSm,
                        border: `1px solid ${theme.border}`,
                        fontSize: 12.5,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          fontFamily: theme.mono,
                          color: theme.primary,
                          background: theme.primaryMuted,
                          padding: '2px 7px',
                          borderRadius: 4,
                        }}
                      >
                        {a.docType}
                      </span>
                      <span style={{ color: theme.ink, fontWeight: 500, flex: 1, minWidth: 0 }}>{a.file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.key)}
                        className="ui-btn ui-btn--ghost"
                        style={{ height: 26, padding: '4px 8px', fontSize: 11 }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </FormSection>
          </Card>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4, flexWrap: 'wrap' }}>
            <Button type="submit" variant="primary" disabled={saved}>
              Save event
            </Button>
            <Link to="/" className="ui-btn ui-btn--ghost" style={{ textDecoration: 'none' }}>
              Back to console
            </Link>
          </div>
        </div>

        {/* Summary panel */}
        <aside
          className="form-summary-panel"
          style={{
            position: 'sticky',
            top: theme.headerH + 16,
          }}
        >
          <Card variant="raised" style={{ padding: 16 }}>
            <div style={{ ...sectionLabel, marginBottom: 12 }}>Event summary</div>
            <div className="summary-primary">
              <span>Dashboard sourced impact</span>
              <strong>{fmtUSD(totalSpend)}</strong>
            </div>
            <SummaryRow label="Event ID" value={eventId || '-'} />
            <SummaryRow label="Fiscal year" value={resolvedFy} />
            <SummaryRow label="Status" value={status} />
            <SummaryRow label="Event types" value={eventTypes.length ? eventTypes.join(' + ') : 'Not selected'} />
            <SummaryRow label="Total spend" value={fmtUSD(totalSpend)} accent={theme.primary} />
            <SummaryRow label="Category" value={category || 'Not selected'} />
            <SummaryRow label="Subcategory" value={subcategory || 'Not selected'} />
            <SummaryRow
              label="Business groups"
              value={groupsWithSpend > 0 ? `${groupsWithSpend} with spend` : 'None'}
            />
            <div style={{ paddingTop: 10 }}>
              <div style={{ ...sectionLabel, marginBottom: 8 }}>Dashboard routing</div>
              <div style={{ display: 'grid', gap: 7 }}>
                {dashboardImpact.map((item) => (
                  <div key={item.label} className="route-row">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ paddingTop: 8 }}>
              <div style={{ ...sectionLabel, marginBottom: 8 }}>Assessments</div>
              {assessmentFlags.length === 0 ? (
                <span style={{ fontSize: 12, color: theme.textTertiary }}>None selected</span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {assessmentFlags.map((f) => (
                    <span
                      key={f}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 999,
                        background: theme.primaryMuted,
                        color: theme.primary,
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {attachments.length > 0 && (
              <div style={{ paddingTop: 10, borderTop: `1px solid ${theme.border}`, marginTop: 10 }}>
                <div style={{ ...sectionLabel, marginBottom: 6 }}>Attachments</div>
                <span style={{ fontSize: 12, color: theme.textSecondary }}>
                  {attachments.length} file{attachments.length !== 1 ? 's' : ''} attached
                </span>
              </div>
            )}
          </Card>
        </aside>
      </form>
    </div>
  );
}
