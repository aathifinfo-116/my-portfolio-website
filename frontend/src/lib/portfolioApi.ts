import { apiClient } from './apiClient';
import type {
  Award,
  Certification,
  DocumentFacets,
  DocumentDomainFilter,
  DocumentFormatFilter,
  StudyDocument,
  CreateInquiryPayload,
  GroupedCertifications,
  InquiryResponse,
  PaginatedResult,
  Profile,
  Project,
  ProjectCounts,
  ProjectFilter,
  ServiceOffering,
} from '@/types/api';

/**
 * One function per backend endpoint. Components never call axios directly —
 * they go through these, so a route change is a single-file edit.
 */
export const portfolioApi = {
  getProfile: async (signal?: AbortSignal): Promise<Profile> => {
    const { data } = await apiClient.get<Profile>('/profile', { signal });
    return data;
  },

  getServices: async (signal?: AbortSignal): Promise<ServiceOffering[]> => {
    const { data } = await apiClient.get<ServiceOffering[]>('/services', { signal });
    return data;
  },

  getProjects: async (
    params: { category?: ProjectFilter; featured?: boolean; limit?: number } = {},
    signal?: AbortSignal,
  ): Promise<Project[]> => {
    const { data } = await apiClient.get<PaginatedResult<Project>>('/projects', {
      signal,
      params: {
        // "All" is a client-side label; omit it so the API returns everything.
        category: params.category === 'All' ? undefined : params.category,
        featured: params.featured,
        limit: params.limit ?? 50,
      },
    });
    return data.items;
  },

  getProjectCounts: async (signal?: AbortSignal): Promise<ProjectCounts> => {
    const { data } = await apiClient.get<ProjectCounts>('/projects/counts', { signal });
    return data;
  },

  getCertifications: async (signal?: AbortSignal): Promise<Certification[]> => {
    const { data } = await apiClient.get<PaginatedResult<Certification>>(
      '/certifications',
      { signal, params: { limit: 100 } },
    );
    return data.items;
  },

  getGroupedCertifications: async (
    signal?: AbortSignal,
  ): Promise<GroupedCertifications> => {
    const { data } = await apiClient.get<GroupedCertifications>(
      '/certifications/grouped',
      { signal },
    );
    return data;
  },

  getDocuments: async (
    params: { domain?: DocumentDomainFilter; fileType?: DocumentFormatFilter } = {},
    signal?: AbortSignal,
  ): Promise<StudyDocument[]> => {
    const { data } = await apiClient.get<PaginatedResult<StudyDocument>>(
      '/documents',
      {
        signal,
        params: {
          // "All" is a client-side label; omit so the API returns everything.
          domain: params.domain === 'All' ? undefined : params.domain,
          fileType: params.fileType === 'All' ? undefined : params.fileType,
          limit: 100,
        },
      },
    );
    return data.items;
  },

  getDocumentFacets: async (signal?: AbortSignal): Promise<DocumentFacets> => {
    const { data } = await apiClient.get<DocumentFacets>('/documents/facets', {
      signal,
    });
    return data;
  },

  /** Origin-relative path of the download endpoint for a document. */
  documentDownloadUrl: (id: string): string =>
    `${apiClient.defaults.baseURL}/documents/${id}/download`,

  /** Origin-relative path of the resume download endpoint. */
  resumeDownloadUrl: (): string =>
    `${apiClient.defaults.baseURL}/profile/resume/download`,

  getAwards: async (signal?: AbortSignal): Promise<Award[]> => {
    const { data } = await apiClient.get<Award[]>('/awards', { signal });
    return data;
  },

  submitInquiry: async (
    payload: CreateInquiryPayload,
  ): Promise<InquiryResponse> => {
    const { data } = await apiClient.post<InquiryResponse>('/contact', payload);
    return data;
  },
};
