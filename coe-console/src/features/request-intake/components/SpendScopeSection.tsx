import { Card } from '../../../components/common/Card';
import { Button, FilterSelect, SegmentedControl } from '../../../components/common/primitives';
import { FormField, FormSection, NumberInput } from '../../../components/form/FormPrimitives';
import { REGION_LABEL, REGIONS, type Region } from '../../../domain/constants';
import { fmtUSD } from '../../../domain/selectors';
import type { GroupMode, RequestValidationErrors } from '../../../domain/requestIntake';
import { numeric, theme } from '../../../styles/theme';
import type { BusinessGroupRow } from '../model/requestIntake.types';

interface SpendScopeSectionProps {
  complete: boolean;
  groupMode: GroupMode;
  groupRows: BusinessGroupRow[];
  visibleRows: BusinessGroupRow[];
  totalSpend: number;
  errors: RequestValidationErrors;
  onGroupModeChange: (value: GroupMode) => void;
  onAddGroupRow: () => void;
  onRemoveGroupRow: (key: string) => void;
  onUpdateGroupRow: (key: string, patch: Partial<BusinessGroupRow>) => void;
}

export function SpendScopeSection({
  complete,
  groupMode,
  groupRows,
  visibleRows,
  totalSpend,
  errors,
  onGroupModeChange,
  onAddGroupRow,
  onRemoveGroupRow,
  onUpdateGroupRow,
}: SpendScopeSectionProps) {
  return (
    <Card>
      <FormSection title="Business groups & spend" complete={complete}>
        <SegmentedControl
          options={[
            { value: 'single' as GroupMode, label: 'Single group' },
            { value: 'multiple' as GroupMode, label: 'Multiple groups' },
          ]}
          value={groupMode}
          onChange={onGroupModeChange}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visibleRows.map((row) => (
            <div
              key={row.key}
              style={{
                display: 'grid',
                gridTemplateColumns:
                  groupMode === 'multiple' && visibleRows.length > 1 ? '1fr 1fr auto' : '1fr 1fr',
                gap: 10,
                alignItems: 'end',
              }}
            >
              <FormField label="Business group">
                <FilterSelect
                  value={row.region}
                  onChange={(value) => onUpdateGroupRow(row.key, { region: value as Region })}
                  options={REGIONS.map((region) => ({
                    value: region,
                    label: `${region} - ${REGION_LABEL[region]}`,
                  }))}
                  style={{ width: '100%' }}
                />
              </FormField>
              <FormField label="Spend ($)">
                <NumberInput
                  value={row.spend}
                  onChange={(value) => onUpdateGroupRow(row.key, { spend: value })}
                  min={0}
                  step={1000}
                  error={!!errors.spend}
                />
              </FormField>
              {groupMode === 'multiple' && visibleRows.length > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onRemoveGroupRow(row.key)}
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
            onClick={onAddGroupRow}
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
  );
}
