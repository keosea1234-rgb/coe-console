import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/primitives';
import { fmtUSD } from '../../domain/selectors';
import { useSession } from '../../domain/session';
import { useStore } from '../../domain/store';
import { sectionLabel, theme } from '../../styles/theme';
import { AssessmentFlagsSection } from './components/AssessmentFlagsSection';
import { AttachmentsSection } from './components/AttachmentsSection';
import { CategoryScopeSection } from './components/CategoryScopeSection';
import { RequestBasicsSection } from './components/RequestBasicsSection';
import { RequestReviewPanel } from './components/RequestReviewPanel';
import { SpendScopeSection } from './components/SpendScopeSection';
import { useRequestDraft } from './hooks/useRequestDraft';
import { useRequestFormState } from './hooks/useRequestFormState';
import { useRequestSubmit } from './hooks/useRequestSubmit';

export function RequestIntakePage() {
  const navigate = useNavigate();
  const events = useStore((state) => state.events);
  const addEvent = useStore((state) => state.addEvent);
  const sessionUser = useSession((state) => state.user);
  const [saved, setSaved] = useState(false);

  const form = useRequestFormState({
    events,
    initialRequestorEmail: sessionUser?.email ?? '',
  });

  const draft = useRequestDraft({
    draftFields: form.draftFields,
    saved,
    restoreDraft: form.restoreDraft,
  });

  const submit = useRequestSubmit({
    saved,
    setSaved,
    events,
    attachments: form.attachments,
    sessionUserId: sessionUser?.id,
    addEvent,
    currentRequestInput: form.currentRequestInput,
    setErrors: form.setErrors,
    setEmailHint: form.setEmailHint,
    setUploadStatus: form.setUploadStatus,
    setUploadProgress: form.setUploadProgress,
    setUploadFailures: form.setUploadFailures,
    onSaved: draft.clearDraft,
    navigateHome: () => navigate('/'),
  });

  const dashboardImpact = [
    {
      label: 'Pipeline',
      value: `${form.groupsWithSpend || 0} event${form.groupsWithSpend === 1 ? '' : 's'}`,
    },
    { label: 'Estimated spend', value: fmtUSD(form.totalSpend) },
  ];
  const errorEntries = Object.entries(form.errors);

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
          <Button type="submit" form="event-form" variant="primary" disabled={submit.saved || submit.submitting}>
            {submit.submitting ? 'Saving...' : 'Save event'}
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
              letterSpacing: 0,
              color: theme.ink,
              lineHeight: 1.15,
            }}
          >
            Log an eSourcing event
          </h1>
          <p
            style={{
              margin: '8px 0 0',
              maxWidth: 660,
              fontSize: 13.5,
              color: theme.textSecondary,
              lineHeight: 1.55,
            }}
          >
            Saved requests are persisted locally and feed the console, pipeline, event register, and
            addressable spend views.
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

      {submit.saved && (
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

      <form id="event-form" onSubmit={submit.handleSubmit} noValidate className="form-layout">
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
              background: draft.draftRestored ? theme.infoBg : theme.surfaceMuted,
              border: `1px solid ${draft.draftRestored ? theme.info : theme.border}`,
              color: draft.draftRestored ? theme.info : theme.textSecondary,
              fontSize: 12.5,
              fontWeight: 650,
              flexWrap: 'wrap',
            }}
          >
            <span>
              {draft.draftRestored
                ? `${draft.formatDraftSavedAt(draft.draftSavedAt)} - restored automatically`
                : draft.formatDraftSavedAt(draft.draftSavedAt)}
            </span>
            {draft.draftSavedAt && (
              <button
                type="button"
                onClick={draft.clearDraft}
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
              <strong style={{ display: 'block', marginBottom: 4 }}>
                Please fix {errorEntries.length} field issue{errorEntries.length === 1 ? '' : 's'}.
              </strong>
              <span>{errorEntries.map(([, message]) => message).join(' ')}</span>
            </div>
          )}

          <RequestBasicsSection
            complete={form.basicsComplete}
            eventDate={form.eventDate}
            resolvedFy={form.resolvedFy}
            status={form.status}
            fyOverride={form.fyOverride}
            fyOptions={form.fyOptions}
            eventId={form.eventId}
            eventTypes={form.eventTypes}
            requestorEmail={form.requestorEmail}
            errors={form.errors}
            emailHint={form.emailHint}
            onEventDateChange={form.setEventDate}
            onStatusChange={form.handleStatusChange}
            onFyOverrideChange={form.setFyOverride}
            onEventIdChange={form.handleEventIdChange}
            onEventTypesChange={form.setEventTypes}
            onRequestorEmailChange={form.setRequestorEmail}
          />

          <SpendScopeSection
            complete={form.spendComplete}
            groupMode={form.groupMode}
            groupRows={form.groupRows}
            visibleRows={form.visibleRows}
            totalSpend={form.totalSpend}
            errors={form.errors}
            onGroupModeChange={form.setGroupMode}
            onAddGroupRow={form.addGroupRow}
            onRemoveGroupRow={form.removeGroupRow}
            onUpdateGroupRow={form.updateGroupRow}
          />

          <CategoryScopeSection
            complete={form.categoryComplete}
            directness={form.directness}
            category={form.category}
            subcategory={form.subcategory}
            subcategoryOptions={form.subcategoryOptions}
            errors={form.errors}
            onDirectnessChange={form.setDirectness}
            onCategoryChange={form.handleCategoryChange}
            onSubcategoryChange={form.setSubcategory}
          />

          <AssessmentFlagsSection
            shouldCostModeling={form.shouldCostModeling}
            riskAssessment={form.riskAssessment}
            esgAssessment={form.esgAssessment}
            onShouldCostModelingChange={form.setShouldCostModeling}
            onRiskAssessmentChange={form.setRiskAssessment}
            onEsgAssessmentChange={form.setEsgAssessment}
          />

          <AttachmentsSection
            docType={form.docType}
            attachments={form.attachments}
            uploadStatus={form.uploadStatus}
            uploadProgress={form.uploadProgress}
            uploadFailures={form.uploadFailures}
            errors={form.errors}
            onDocTypeChange={form.setDocType}
            onFiles={form.handleFileSelect}
            onRemoveAttachment={form.removeAttachment}
          />

          <div style={{ display: 'flex', gap: 10, paddingTop: 4, flexWrap: 'wrap' }}>
            <Button type="submit" variant="primary" disabled={submit.saved || submit.submitting}>
              {submit.submitting ? 'Saving...' : 'Save event'}
            </Button>
            <Link to="/" className="ui-btn ui-btn--ghost" style={{ textDecoration: 'none' }}>
              Back to console
            </Link>
          </div>
        </div>

        <RequestReviewPanel
          totalSpend={form.totalSpend}
          eventId={form.eventId}
          resolvedFy={form.resolvedFy}
          status={form.status}
          eventTypes={form.eventTypes}
          category={form.category}
          subcategory={form.subcategory}
          groupsWithSpend={form.groupsWithSpend}
          dashboardImpact={dashboardImpact}
          assessmentFlags={form.assessmentFlags}
          attachmentsCount={form.attachments.length}
        />
      </form>
    </div>
  );
}
