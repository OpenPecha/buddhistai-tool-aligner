import { useQuery } from '@tanstack/react-query';

interface RelatedInstance {
  id: string;
  type?: string;
  incipit_title?: Record<string, string>;
  alt_incipit_titles?: Record<string, string>;
  content?: string;
  annotations?: Array<{
    annotation_id: string;
    type: string;
  }>;
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
    queryFn: async (): Promise<RelatedInstance[]> => {
      if (!instanceId) {
        throw new Error('Instance ID is required');
      }

      const response = await fetch(
        `https://openpecha-text-cataloger.onrender.com/instances/${instanceId}/relatedto`,
        {
          headers: {
            'accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch related instances: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Ensure we return an array
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object') {
        // If it's a single object, wrap it in an array
        return [data];
      } else {
        // If no data or invalid format, return empty array
        return [];
      }
    },
    enabled: Boolean(instanceId) && (options.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
