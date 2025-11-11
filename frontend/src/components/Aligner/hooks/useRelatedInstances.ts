import { useQuery } from '@tanstack/react-query';
import { fetchRelatedInstances } from '../../../api/instances';

interface RelatedInstance {
  // Support both API response formats
  id?: string;
  instance_id?: string;
  type?: string;
  incipit_title?: Record<string, string>;
  alt_incipit_titles?: Record<string, string>;
  content?: string;
  annotations?: Array<{
    annotation_id: string;
    type: string;
  }>;
  // New API response format
  metadata?: {
    instance_type?: string;
    copyright?: string;
    text_id?: string;
    title?: Record<string, string>;
    alt_titles?: Array<Record<string, string>>;
    language?: string;
    contributions?: Array<{
      person_id: string;
      role: string;
    }>;
  };
  annotation?: string;
  relationship?: string;
}

interface UseRelatedInstancesOptions {
  enabled?: boolean;
}

export const useRelatedInstances = (
  instanceId: string | null,
  options: UseRelatedInstancesOptions = {}
) => {
  return useQuery({
    queryKey: ['relatedInstances', instanceId],
    queryFn: (): Promise<RelatedInstance[]> => {
      if (!instanceId) {
        throw new Error('Instance ID is required');
      }
      return fetchRelatedInstances(instanceId);
    },
    refetchInterval:false,
    refetchOnWindowFocus:false,
    refetchOnMount:false,
    refetchOnReconnect:false,
    refetchIntervalInBackground:false,
    enabled: Boolean(instanceId) && (options.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
