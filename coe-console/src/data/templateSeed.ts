import { CATEGORIES, type Category } from '../domain/categories';
import type { CategoryTemplate, DocumentType, TemplateFileFormat } from '../domain/templateTypes';

const OWNERS = [
  'coe-direct@amcor.example',
  'coe-indirect@amcor.example',
  'coe-logistics@amcor.example',
  'coe-tools@amcor.example',
] as const;

const formatByType: Record<DocumentType, TemplateFileFormat> = {
  RFI: 'docx',
  RFQ: 'xlsx',
};

const sizeByType: Record<DocumentType, number> = {
  RFI: 184,
  RFQ: 276,
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function templateDescription(category: Category, documentType: DocumentType): string {
  const subcategoryScope = category.subcategories.slice(0, 3).join(', ');
  if (documentType === 'RFI') {
    return `Supplier discovery and capability assessment workbook for ${category.name}, with prompts for ${subcategoryScope}.`;
  }
  return `Commercial bid template for ${category.name} events, including lot setup, response fields, and evaluation inputs.`;
}

function buildTemplate(category: Category, documentType: DocumentType): CategoryTemplate {
  const categorySlug = slugify(category.name);
  const documentSlug = documentType.toLowerCase();
  const fileFormat = formatByType[documentType];
  const fileName = `${categorySlug}-${documentSlug}-template.${fileFormat}`;
  const categoryIndex = Number(category.id);

  return {
    id: `template-${category.id}-${documentSlug}`,
    category: category.name,
    documentType,
    title: `${category.name} ${documentType} template`,
    description: templateDescription(category, documentType),
    version: documentType === 'RFI' ? 'v1.1' : 'v1.2',
    fileName,
    fileFormat,
    fileSizeKb: sizeByType[documentType] + categoryIndex * 3,
    downloadUrl: `/assets/templates/${categorySlug}/${fileName}`,
    lastUpdated: `2026-${String(((categoryIndex + (documentType === 'RFQ' ? 3 : 0)) % 6) + 1).padStart(2, '0')}-15`,
    owner: OWNERS[(categoryIndex - 1) % OWNERS.length],
  };
}

export function generateTemplateSeed(): CategoryTemplate[] {
  return CATEGORIES.flatMap((category) => [
    buildTemplate(category, 'RFI'),
    buildTemplate(category, 'RFQ'),
  ]);
}

export const TEMPLATE_SEED = generateTemplateSeed();
