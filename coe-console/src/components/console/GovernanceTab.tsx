import { theme } from '../../styles/theme';
import { Card } from '../common/Card';
import { IconDownload, IconFileText } from './icons';

interface GovernanceDocument {
  title: string;
  label: string;
  description: string;
  fileName: string;
  format: 'docx' | 'pdf';
  owner: string;
  downloadUrl: string;
}

const GOVERNANCE_DOCUMENTS: GovernanceDocument[] = [
  {
    title: 'Mutual NDA example',
    label: 'NDA',
    description: 'Balanced confidentiality terms for supplier discovery, RFx preparation, and early due diligence.',
    fileName: 'mutual-nda-example.docx',
    format: 'docx',
    owner: 'Legal',
    downloadUrl: '/assets/governance/mutual-nda-example.docx',
  },
  {
    title: 'Supplier code of conduct',
    label: 'Code of conduct',
    description: 'Supplier expectations covering ethics, labor, safety, environment, and reporting obligations.',
    fileName: 'supplier-code-of-conduct-example.pdf',
    format: 'pdf',
    owner: 'ESG & Compliance',
    downloadUrl: '/assets/governance/supplier-code-of-conduct-example.pdf',
  },
  {
    title: 'Master services agreement example',
    label: 'MSA',
    description: 'Commercial terms starter for services scopes, liability, service levels, IP, and termination.',
    fileName: 'msa-example.docx',
    format: 'docx',
    owner: 'Procurement Legal',
    downloadUrl: '/assets/governance/msa-example.docx',
  },
];

export function GovernanceTab() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="governance-hero">
        <div>
          <div className="category-eyebrow">Governance library</div>
          <h1 className="category-hero-title">Contracting and conduct examples</h1>
          <p className="category-hero-copy">
            Practical starting points for sourcing governance. Use these examples with the relevant legal and
            compliance review path before sending externally.
          </p>
        </div>
      </div>

      <div className="governance-grid">
        {GOVERNANCE_DOCUMENTS.map((document) => (
          <GovernanceCard key={document.fileName} document={document} />
        ))}
      </div>
    </div>
  );
}

function GovernanceCard({ document }: { document: GovernanceDocument }) {
  const accent = document.format === 'pdf' ? theme.danger : theme.primary;

  return (
    <Card className="governance-card" pad={18}>
      <div className="governance-card-top">
        <span className="governance-doc-icon">
          <IconFileText size={17} color={accent} />
        </span>
        <span className="governance-label">{document.label}</span>
      </div>

      <h2 className="governance-title">{document.title}</h2>
      <p className="governance-copy">{document.description}</p>

      <div className="governance-meta">
        <span>{document.owner}</span>
        <span>{document.format.toUpperCase()}</span>
      </div>

      <a
        href={document.downloadUrl}
        download={document.fileName}
        className="ui-btn ui-btn--primary"
        style={{ marginTop: 16, textDecoration: 'none', width: '100%', height: 36 }}
        aria-label={`Download ${document.title}`}
      >
        <IconDownload size={14} />
        Download example
      </a>
    </Card>
  );
}
