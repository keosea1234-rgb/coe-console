import { useCallback, useEffect, useMemo, useState } from 'react';
import { CATEGORY_BY_NAME } from '../../../domain/categories';
import {
  EVENT_TYPES,
  FYS,
  REGIONS,
  STATUSES,
  type EventType,
  type FY,
  type Region,
  type Status,
} from '../../../domain/constants';
import {
  deriveStatusFromDate,
  generateNextEventId,
  getFiscalYearFromDate,
  isValidEmail,
} from '../../../domain/eventFormHelpers';
import {
  type Directness,
  type FyOverride,
  type GroupMode,
  type RequestEventInput,
  type RequestValidationErrors,
} from '../../../domain/requestIntake';
import { validateAttachmentFile } from '../../../domain/attachments';
import type { SourcingEvent } from '../../../domain/types';
import {
  DOC_TYPES,
  createDefaultGroupRows,
  nextRequestRowKey,
  type AttachmentRow,
  type BusinessGroupRow,
  type DocType,
  type RequestDraft,
  type RequestDraftFields,
  type UploadFailure,
  type UploadProgress,
  type UploadStatus,
} from '../model/requestIntake.types';

export function todayIso(date = new Date()) {
  const tzOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
}

const DEFAULT_DATE = todayIso();

interface UseRequestFormStateArgs {
  events: SourcingEvent[];
  initialRequestorEmail?: string;
}

export function useRequestFormState({ events, initialRequestorEmail = '' }: UseRequestFormStateArgs) {
  const [eventDate, setEventDate] = useState(DEFAULT_DATE);
  const [status, setStatus] = useState<Status>(() => deriveStatusFromDate(DEFAULT_DATE));
  const [statusTouched, setStatusTouched] = useState(false);
  const [fyOverride, setFyOverride] = useState<FyOverride>('auto');
  const [eventId, setEventId] = useState(() =>
    generateNextEventId(getFiscalYearFromDate(DEFAULT_DATE), events),
  );
  const [eventIdTouched, setEventIdTouched] = useState(false);
  const [eventTypes, setEventTypes] = useState<EventType[]>(['Reverse Auction']);
  const [requestorEmail, setRequestorEmail] = useState(initialRequestorEmail);

  const [groupMode, setGroupMode] = useState<GroupMode>('multiple');
  const [groupRows, setGroupRows] = useState<BusinessGroupRow[]>(() => createDefaultGroupRows());

  const [directness, setDirectness] = useState<Directness>('Direct');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');

  const [shouldCostModeling, setShouldCostModeling] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState(false);
  const [esgAssessment, setEsgAssessment] = useState(false);

  const [docType, setDocType] = useState<DocType>('Bid Template');
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadFailures, setUploadFailures] = useState<UploadFailure[]>([]);

  const [errors, setErrors] = useState<RequestValidationErrors>({});
  const [emailHint, setEmailHint] = useState<string | undefined>();

  const autoFy = useMemo(() => getFiscalYearFromDate(eventDate), [eventDate]);
  const resolvedFy: FY = fyOverride === 'auto' ? autoFy : fyOverride;

  const visibleRows = useMemo(
    () => (groupMode === 'single' ? groupRows.slice(0, 1) : groupRows),
    [groupMode, groupRows],
  );
  const totalSpend = useMemo(
    () => visibleRows.reduce((sum, row) => sum + (row.spend || 0), 0),
    [visibleRows],
  );
  const groupsWithSpend = useMemo(
    () => visibleRows.filter((row) => row.spend > 0).length,
    [visibleRows],
  );

  const subcategoryOptions = useMemo(
    () => (category ? CATEGORY_BY_NAME[category]?.subcategories ?? [] : []),
    [category],
  );

  const assessmentFlags = useMemo(
    () =>
      [
        shouldCostModeling && 'Should Cost',
        riskAssessment && 'Risk',
        esgAssessment && 'ESG',
      ].filter(Boolean) as string[],
    [esgAssessment, riskAssessment, shouldCostModeling],
  );

  const basicsComplete = !!(
    eventDate &&
    eventTypes.length &&
    requestorEmail &&
    isValidEmail(requestorEmail)
  );
  const spendComplete = groupsWithSpend > 0;
  const categoryComplete = !!category && !!subcategory;

  const fyOptions = useMemo(
    () => [
      { value: 'auto', label: `Auto (${autoFy})` },
      ...FYS.map((fy) => ({ value: fy, label: fy })),
    ],
    [autoFy],
  );

  useEffect(() => {
    if (!statusTouched) setStatus(deriveStatusFromDate(eventDate));
  }, [eventDate, statusTouched]);

  useEffect(() => {
    if (!eventIdTouched) {
      setEventId(generateNextEventId(resolvedFy, events));
    }
  }, [resolvedFy, events, eventIdTouched]);

  const handleStatusChange = useCallback((value: Status) => {
    setStatus(value);
    setStatusTouched(true);
  }, []);

  const handleEventIdChange = useCallback((value: string) => {
    setEventId(value);
    setEventIdTouched(true);
  }, []);

  const handleCategoryChange = useCallback((cat: string) => {
    setCategory(cat);
    setSubcategory(CATEGORY_BY_NAME[cat]?.subcategories[0] ?? '');
  }, []);

  const addGroupRow = useCallback(() => {
    if (groupRows.length >= REGIONS.length) return;
    const used = new Set(groupRows.map((row) => row.region));
    const nextRegion = REGIONS.find((region) => !used.has(region)) ?? 'NA';
    setGroupRows((rows) => [...rows, { key: nextRequestRowKey(), region: nextRegion, spend: 0 }]);
  }, [groupRows]);

  const removeGroupRow = useCallback((key: string) => {
    setGroupRows((rows) => rows.filter((row) => row.key !== key));
  }, []);

  const updateGroupRow = useCallback((key: string, patch: Partial<BusinessGroupRow>) => {
    setGroupRows((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }, []);

  const handleFileSelect = useCallback(
    (files: FileList) => {
      const added: AttachmentRow[] = Array.from(files).map((file) => {
        const issue = validateAttachmentFile(file);
        return {
          key: nextRequestRowKey(),
          docType,
          file,
          error: issue?.message,
        };
      });
      setAttachments((prev) => [...prev, ...added]);
    },
    [docType],
  );

  const removeAttachment = useCallback((key: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.key !== key));
  }, []);

  const currentRequestInput = useCallback(
    (): RequestEventInput => ({
      eventDate,
      status,
      resolvedFy,
      eventId,
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
    }),
    [
      category,
      directness,
      esgAssessment,
      eventDate,
      eventId,
      eventTypes,
      groupMode,
      groupRows,
      requestorEmail,
      resolvedFy,
      riskAssessment,
      shouldCostModeling,
      status,
      subcategory,
    ],
  );

  const draftFields = useMemo(
    (): RequestDraftFields => ({
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
    }),
    [
      category,
      directness,
      docType,
      esgAssessment,
      eventDate,
      eventId,
      eventIdTouched,
      eventTypes,
      fyOverride,
      groupMode,
      groupRows,
      requestorEmail,
      riskAssessment,
      shouldCostModeling,
      status,
      statusTouched,
      subcategory,
    ],
  );

  const restoreDraft = useCallback((draft: Partial<RequestDraft>) => {
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
          .map((row) => ({
            key: row.key || nextRequestRowKey(),
            region: row.region as Region,
            spend: Number(row.spend) || 0,
          })),
      );
    }
    if (draft.directness === 'Direct' || draft.directness === 'Indirect') setDirectness(draft.directness);
    if (draft.category && CATEGORY_BY_NAME[draft.category]) setCategory(draft.category);
    if (draft.subcategory) setSubcategory(draft.subcategory);
    if (typeof draft.shouldCostModeling === 'boolean') setShouldCostModeling(draft.shouldCostModeling);
    if (typeof draft.riskAssessment === 'boolean') setRiskAssessment(draft.riskAssessment);
    if (typeof draft.esgAssessment === 'boolean') setEsgAssessment(draft.esgAssessment);
    if (draft.docType && DOC_TYPES.includes(draft.docType)) setDocType(draft.docType);
  }, []);

  return {
    eventDate,
    status,
    fyOverride,
    eventId,
    eventTypes,
    requestorEmail,
    groupMode,
    groupRows,
    visibleRows,
    directness,
    category,
    subcategory,
    shouldCostModeling,
    riskAssessment,
    esgAssessment,
    docType,
    attachments,
    uploadStatus,
    uploadProgress,
    uploadFailures,
    errors,
    emailHint,
    autoFy,
    resolvedFy,
    totalSpend,
    groupsWithSpend,
    subcategoryOptions,
    assessmentFlags,
    basicsComplete,
    spendComplete,
    categoryComplete,
    fyOptions,
    draftFields,
    setEventDate,
    setFyOverride,
    setEventTypes,
    setRequestorEmail,
    setGroupMode,
    setDirectness,
    setSubcategory,
    setShouldCostModeling,
    setRiskAssessment,
    setEsgAssessment,
    setDocType,
    setUploadStatus,
    setUploadProgress,
    setUploadFailures,
    setErrors,
    setEmailHint,
    handleStatusChange,
    handleEventIdChange,
    handleCategoryChange,
    addGroupRow,
    removeGroupRow,
    updateGroupRow,
    handleFileSelect,
    removeAttachment,
    currentRequestInput,
    restoreDraft,
  };
}
