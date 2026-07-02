import { CATEGORIES, type Category } from '../../domain/categories';
import { theme } from '../../styles/theme';
import { Card } from '../common/Card';
import { IconDownload, IconFileText, IconSpreadsheet } from './icons';

type CategoryPackType = 'ESG' | 'Risk' | 'Intelligence' | 'Templates';

interface CategoryPack {
  type: CategoryPackType;
  title: string;
  description: string;
  fileName: string;
  fileFormat: 'docx' | 'xlsx' | 'pdf';
  downloadUrl: string;
}

const PACK_META: Array<Omit<CategoryPack, 'fileName' | 'downloadUrl'>> = [
  {
    type: 'ESG',
    title: 'ESG supplier screen',
    description: 'Sustainability, compliance, and supplier disclosure prompts for category events.',
    fileFormat: 'xlsx',
  },
  {
    type: 'Risk',
    title: 'Risk assessment',
    description: 'Operational, supply continuity, geopolitical, and quality risk checklist.',
    fileFormat: 'docx',
  },
  {
    type: 'Intelligence',
    title: 'Market intelligence',
    description: 'Should-cost drivers, market signals, and supplier landscape briefing template.',
    fileFormat: 'pdf',
  },
  {
    type: 'Templates',
    title: 'RFx template pack',
    description: 'Category-specific RFI, RFQ, scoring, and award recommendation starter files.',
    fileFormat: 'xlsx',
  },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildPacks(category: Category): CategoryPack[] {
  const categorySlug = slugify(category.name);

  return PACK_META.map((pack) => {
    const packSlug = slugify(pack.type);
    const fileName = `${categorySlug}-${packSlug}.${pack.fileFormat}`;

    return {
      ...pack,
      fileName,
      downloadUrl: `/assets/category/${categorySlug}/${fileName}`,
    };
  });
}

function FileIcon({ format, color }: { format: CategoryPack['fileFormat']; color: string }) {
  if (format === 'xlsx') return <IconSpreadsheet size={16} color={color} />;
  return <IconFileText size={16} color={format === 'pdf' ? theme.danger : color} />;
}

export function CategoryTab() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="category-hero">
        <div>
          <div className="category-eyebrow">Category playbooks</div>
          <h1 className="category-hero-title">Category workbench</h1>
          <p className="category-hero-copy">
            Download the ESG, risk, market intelligence, and RFx template packs for each procurement category.
          </p>
        </div>
        <div className="category-hero-metrics" aria-label="Category library summary">
          <Metric value={CATEGORIES.length} label="categories" />
          <Metric value="4" label="packs each" />
          <Metric value={`${CATEGORIES.length * 4}`} label="downloads" />
        </div>
      </div>

      <div className="category-page-grid">
        {CATEGORIES.map((category) => (
          <CategoryWorkbenchCard key={category.id} category={category} packs={buildPacks(category)} />
        ))}
      </div>
    </div>
  );
}

function CategoryWorkbenchCard({ category, packs }: { category: Category; packs: CategoryPack[] }) {
  return (
    <Card className="category-workbench-card" pad={0}>
      <div className="category-workbench-head" style={{ borderTopColor: category.color }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span className="category-workbench-dot" style={{ background: category.color }} />
          <div style={{ minWidth: 0 }}>
            <h2 className="category-workbench-title">{category.name}</h2>
            <div className="category-workbench-meta">
              ${category.baseSpend}M baseline · {category.subcategories.length} subcategories
            </div>
          </div>
        </div>
        <span className="category-workbench-id">{category.id}</span>
      </div>

      <div className="category-subcategory-strip">
        {category.subcategories.slice(0, 5).map((subcategory) => (
          <span key={subcategory}>{subcategory}</span>
        ))}
      </div>

      <div className="category-download-list">
        {packs.map((pack) => (
          <a
            key={pack.type}
            href={pack.downloadUrl}
            download={pack.fileName}
            className="category-download-row"
            style={{ ['--category-accent' as string]: category.color }}
            aria-label={`Download ${category.name} ${pack.type} pack`}
          >
            <span className="category-download-icon">
              <FileIcon format={pack.fileFormat} color={category.color} />
            </span>
            <span className="category-download-copy">
              <strong>{pack.title}</strong>
              <span>{pack.description}</span>
            </span>
            <span className="category-download-action">
              <IconDownload size={14} color={category.color} />
            </span>
          </a>
        ))}
      </div>
    </Card>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
