import { useMemo, useState, type ReactNode } from 'react';
import { theme } from '../../styles/theme';
import { REGIONS, FYS, EVENT_TYPES } from '../../domain/constants';
import { CATEGORIES } from '../../domain/categories';
import { useStore } from '../../domain/store';
import {
  applyFilters,
  computeTotals,
  fmtUSD,
  fmtPct,
  fmtNum,
} from '../../domain/selectors';
import { Chip } from '../common/primitives';

type MenuKey = 'fy' | 'category' | 'subcategory' | null;

export function FilterBar() {
  const {
    filters,
    events,
    baseline,
    toggleFy,
    toggleCategory,
    toggleSubcategory,
    toggleRegion,
    toggleType,
    clearFilters,
  } = useStore();
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);

  const summary = useMemo(() => {
    const filtered = applyFilters(events, filters);
    return computeTotals(filtered, filters, baseline);
  }, [events, filters, baseline]);

  const subcategoryOptions = useMemo(() => {
    const cats = filters.categories.length
      ? CATEGORIES.filter((category) => filters.categories.includes(category.name))
      : CATEGORIES;

    return cats.flatMap((category) =>
      category.subcategories.map((subcategory) => ({
        value: subcategory,
        label: subcategory,
        meta: category.name,
      })),
    );
  }, [filters.categories]);

  const hasFilters =
    filters.regions.length ||
    filters.fys.length ||
    filters.categories.length ||
    filters.subcategories.length ||
    filters.types.length;

  return (
    <div className="sticky-filter">
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '8px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          minHeight: theme.filterH,
        }}
      >
        <ChipGroup>
          {REGIONS.map((r) => (
            <Chip key={r} label={r} active={filters.regions.includes(r)} onClick={() => toggleRegion(r)} />
          ))}
        </ChipGroup>

        <Divider />

        <MultiSelectMenu
          title="Fiscal year"
          allLabel="All fiscal years"
          open={openMenu === 'fy'}
          onOpen={() => setOpenMenu(openMenu === 'fy' ? null : 'fy')}
          selected={filters.fys}
          options={FYS.map((fy) => ({ value: fy, label: fy }))}
          onToggle={toggleFy}
        />

        <MultiSelectMenu
          title="Categories"
          allLabel="All categories"
          open={openMenu === 'category'}
          onOpen={() => setOpenMenu(openMenu === 'category' ? null : 'category')}
          selected={filters.categories}
          options={CATEGORIES.map((category) => ({
            value: category.name,
            label: category.name,
            meta: category.id,
            color: category.color,
          }))}
          onToggle={toggleCategory}
          width={290}
        />

        <MultiSelectMenu
          title="Subcategories"
          allLabel="All subcategories"
          open={openMenu === 'subcategory'}
          onOpen={() => setOpenMenu(openMenu === 'subcategory' ? null : 'subcategory')}
          selected={filters.subcategories}
          options={subcategoryOptions}
          onToggle={toggleSubcategory}
          width={320}
        />

        <Divider />

        <ChipGroup>
          {EVENT_TYPES.map((t) => (
            <Chip key={t} label={t} active={filters.types.includes(t)} onClick={() => toggleType(t)} />
          ))}
        </ChipGroup>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ui-btn ui-btn--ghost"
              style={{ padding: '5px 10px', fontSize: 12 }}
            >
              Clear filters
            </button>
          )}
          <div
            style={{
              fontSize: 11.5,
              color: theme.textSecondary,
              fontFamily: theme.mono,
              lineHeight: 1.4,
            }}
          >
            <span style={{ color: theme.ink, fontWeight: 700 }}>{fmtNum(summary.events)}</span> events
            <span style={{ color: theme.textTertiary, margin: '0 6px' }}>|</span>
            <span style={{ color: theme.ink, fontWeight: 700 }}>{fmtUSD(summary.addressable)}</span> addr.
            <span style={{ color: theme.textTertiary, margin: '0 6px' }}>|</span>
            <span style={{ color: theme.primary, fontWeight: 700 }}>{fmtPct(summary.coverage)}</span> cov.
          </div>
        </div>
      </div>
    </div>
  );
}

function MultiSelectMenu({
  title,
  allLabel,
  options,
  selected,
  open,
  onOpen,
  onToggle,
  width = 240,
}: {
  title: string;
  allLabel: string;
  options: { value: string; label: string; meta?: string; color?: string }[];
  selected: string[];
  open: boolean;
  onOpen: () => void;
  onToggle: (value: never) => void;
  width?: number;
}) {
  const label = selected.length === 0 ? allLabel : selected.length === 1 ? selected[0] : `${selected.length} selected`;
  const selectedSet = new Set(selected);

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={onOpen}
        aria-expanded={open}
        style={{
          height: 34,
          minWidth: 150,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '0 10px',
          borderRadius: theme.radiusSm,
          border: `1px solid ${open || selected.length ? theme.primary : theme.borderStrong}`,
          background: selected.length ? theme.primaryMuted : theme.surface,
          color: selected.length ? theme.primary : theme.textSecondary,
          boxShadow: open ? theme.shadowFocus : 'none',
          transition: `all ${theme.transitionFast} ${theme.easing}`,
        }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
          <span
            style={{
              fontSize: 9,
              fontFamily: theme.mono,
              color: selected.length ? theme.primary : theme.textTertiary,
              textTransform: 'uppercase',
              letterSpacing: '.05em',
              lineHeight: 1,
            }}
          >
            {title}
          </span>
          <span
            style={{
              maxWidth: 176,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: 12,
              fontWeight: 800,
              lineHeight: 1.4,
            }}
          >
            {label}
          </span>
        </span>
        <span style={{ color: theme.textTertiary, fontSize: 13, transform: open ? 'rotate(180deg)' : undefined }}>
          v
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 0,
            zIndex: 40,
            width,
            maxHeight: 360,
            overflow: 'hidden',
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius,
            boxShadow: theme.shadowRaised,
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              borderBottom: `1px solid ${theme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: theme.ink }}>{title}</div>
              <div style={{ fontSize: 10.5, color: theme.textTertiary }}>{label}</div>
            </div>
          </div>
          <div style={{ maxHeight: 292, overflowY: 'auto', padding: 6 }}>
            {options.map((option) => {
              const active = selectedSet.has(option.value);
              return (
                <button
                  key={`${option.meta ?? ''}-${option.value}`}
                  type="button"
                  onClick={() => onToggle(option.value as never)}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: active ? theme.primaryMuted : 'transparent',
                    borderRadius: 7,
                    padding: '8px 9px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    textAlign: 'left',
                    color: active ? theme.primary : theme.ink,
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 5,
                      border: `1.5px solid ${active ? theme.primary : theme.borderStrong}`,
                      background: active ? theme.primary : theme.surface,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {active && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>}
                  </span>
                  {option.color && (
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: option.color, flexShrink: 0 }} />
                  )}
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700 }}>{option.label}</span>
                    {option.meta && (
                      <span style={{ display: 'block', fontSize: 10.5, color: theme.textTertiary }}>
                        {option.meta}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ChipGroup({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{children}</div>;
}

function Divider() {
  return (
    <div
      style={{ width: 1, height: 20, background: theme.border, flexShrink: 0 }}
      aria-hidden
    />
  );
}
