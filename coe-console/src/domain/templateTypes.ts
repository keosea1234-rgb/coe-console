import type { Category } from './categories';

export const DOCUMENT_TYPES = ['RFI', 'RFQ'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const TEMPLATE_FILE_FORMATS = ['docx', 'xlsx', 'pdf'] as const;
export type TemplateFileFormat = (typeof TEMPLATE_FILE_FORMATS)[number];

export interface CategoryTemplate {
  id: string;
  category: Category['name'];
  documentType: DocumentType;
  title: string;
  description: string;
  version: string;
  fileName: string;
  fileFormat: TemplateFileFormat;
  fileSizeKb?: number;
  downloadUrl: string;
  lastUpdated: string;
  owner: string;
}

export const LEARNING_RESOURCE_TYPES = ['guide', 'video', 'quickref', 'faq'] as const;
export type LearningResourceType = (typeof LEARNING_RESOURCE_TYPES)[number];

export const LEARNING_TOPICS = [
  'eSourcing Fundamentals',
  'Archlet',
  'RFx Process',
  'Negotiation',
  'CoE Governance',
] as const;
export type LearningTopic = (typeof LEARNING_TOPICS)[number];

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  type: LearningResourceType;
  topic: LearningTopic;
  estimatedMinutes?: number;
  resourceUrl: string;
  lastUpdated: string;
}
