import { useCallback } from 'react';
import { portfolioApi } from '@/lib/portfolioApi';
import { useApiResource } from './useApiResource';
import type {
  DocumentDomainFilter,
  DocumentFormatFilter,
  ProjectFilter,
} from '@/types/api';

/** One hook per section, so each renders its own loading and error state. */

export const useProfile = () =>
  useApiResource((signal) => portfolioApi.getProfile(signal));

export const useServices = () =>
  useApiResource((signal) => portfolioApi.getServices(signal));

export const useProjects = (category: ProjectFilter) => {
  const fetcher = useCallback(
    (signal: AbortSignal) => portfolioApi.getProjects({ category }, signal),
    [category],
  );
  // Refetches whenever the active filter chip changes.
  return useApiResource(fetcher, [category]);
};

export const useProjectCounts = () =>
  useApiResource((signal) => portfolioApi.getProjectCounts(signal));

export const useCertifications = () =>
  useApiResource((signal) => portfolioApi.getCertifications(signal));

/** Both filter rows feed one request; the API combines them with AND. */
export const useDocuments = (
  domain: DocumentDomainFilter,
  fileType: DocumentFormatFilter,
) => {
  const fetcher = useCallback(
    (signal: AbortSignal) =>
      portfolioApi.getDocuments({ domain, fileType }, signal),
    [domain, fileType],
  );
  return useApiResource(fetcher, [domain, fileType]);
};

export const useDocumentFacets = () =>
  useApiResource((signal) => portfolioApi.getDocumentFacets(signal));

export const useAwards = () =>
  useApiResource((signal) => portfolioApi.getAwards(signal));
