/**
 * Mirrors the NestJS entities and DTOs. Keep these in sync with the
 * entity files under backend/src/modules.
 */

export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------- Profile ----------

export interface SocialLink {
  platform: string;
  url: string;
  /** Lucide icon name, resolved at render time. */
  icon: string;
}

export interface Profile extends BaseRecord {
  name: string;
  title: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  yearsExperience: string;
  projectsCompleted: number;
  happyClients: number;
  awardsWon: number;
  email: string;
  phone: string | null;
  location: string | null;
  socialLinks: SocialLink[];
  resumeUrl: string | null;
  resumeFileName: string;
  isAvailableForHire: boolean;
  availabilityNote: string | null;
}

// ---------- Services ----------

export interface ServiceOffering extends BaseRecord {
  title: string;
  description: string;
  iconName: string;
  accentGradient: string | null;
  techTags: string[];
  isPublished: boolean;
  sortOrder: number;
}

// ---------- Projects ----------

export const PROJECT_CATEGORIES = [
  'Microservices',
  'Full-Stack',
  'Cloud',
  'Mobile',
  'Other',
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

/** "All" is a UI-only filter value; it is never sent to the API. */
export type ProjectFilter = 'All' | ProjectCategory;

export interface Project extends BaseRecord {
  title: string;
  subtitle: string | null;
  category: ProjectCategory;
  description: string;
  problem: string | null;
  solution: string | null;
  impact: string | null;
  techStack: string[];
  githubUrl: string | null;
  liveUrl: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  completedOn: string | null;
}

export type ProjectCounts = Partial<Record<ProjectFilter, number>>;

// ---------- Certifications ----------

export const CERTIFICATION_CATEGORIES = [
  'Academic Degree',
  'Professional',
  'Certification',
] as const;

export type CertificationCategory = (typeof CERTIFICATION_CATEGORIES)[number];

export interface Certification extends BaseRecord {
  title: string;
  institution: string;
  category: CertificationCategory;
  description: string | null;
  issuedOn: string | null;
  issuedYear: number | null;
  documentUrl: string | null;
  documentName: string | null;
  documentSizeBytes: number | null;
  badgeUrl: string | null;
  credentialUrl: string | null;
  isVerified: boolean;
  isPublished: boolean;
  sortOrder: number;
}

export interface GroupedCertifications {
  groups: Record<CertificationCategory, Certification[]>;
  total: number;
}

// ---------- Awards ----------

export interface Award extends BaseRecord {
  title: string;
  issuer: string;
  year: number | null;
  description: string | null;
  iconName: string;
  imageUrl: string | null;
  isPublished: boolean;
  sortOrder: number;
}

// ---------- Contact ----------

export interface CreateInquiryPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
  /** Honeypot — must stay empty; bots that fill it are silently dropped. */
  website?: string;
}

export interface InquiryResponse {
  success: true;
  message: string;
}

/** Shape produced by the backend's AllExceptionsFilter. */
export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}


// ---------- Documents & Study Materials ----------

export const DOCUMENT_DOMAINS = [
  'Development',
  'Cloud',
  'DevOps',
  'AI',
  'Management',
  'Research',
  'Other',
] as const;

export type DocumentDomain = (typeof DOCUMENT_DOMAINS)[number];

/** "All" is a UI-only filter value; it is never sent to the API. */
export type DocumentDomainFilter = 'All' | DocumentDomain;

export const DOCUMENT_FILE_TYPES = ['pdf', 'docx', 'pptx'] as const;

export type DocumentFileType = (typeof DOCUMENT_FILE_TYPES)[number];

export type DocumentFormatFilter = 'All' | DocumentFileType;

export interface StudyDocument extends BaseRecord {
  title: string;
  description: string | null;
  domain: DocumentDomain;
  fileType: DocumentFileType;
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string | null;
  topic: string | null;
  uploadedAt: string;
  isPublished: boolean;
  sortOrder: number;
  downloadCount: number;
}

export interface DocumentFacets {
  domains: Partial<Record<DocumentDomainFilter, number>>;
  fileTypes: Partial<Record<DocumentFormatFilter, number>>;
  total: number;
}
