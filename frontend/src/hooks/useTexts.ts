import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTexts, fetchTextInstances, fetchInstance } from '../api/text';
import type { OpenPechaTextInstance } from '../types/text';

// Query keys
export const textKeys = {
  all: ['texts'] as const,
  lists: () => [...textKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...textKeys.lists(), { filters }] as const,
  details: () => [...textKeys.all, 'detail'] as const,
  detail: (id: string) => [...textKeys.details(), id] as const,
  instances: (id: string) => [...textKeys.detail(id), 'instances'] as const,
};

// Hook for fetching texts list
export const useTexts = (params?: { 
  limit?: number; 
  offset?: number; 
  language?: string; 
  author?: string 
}) => {
  return useQuery({
    queryKey: textKeys.list(params || {}),
    queryFn: () => fetchTexts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching text instances
export const useTextInstances = (textId: string|null) => {

  return useQuery({
    queryKey: textKeys.instances(textId || ''),
    queryFn: () => textId ? fetchTextInstances(textId) : null,
    enabled: !!textId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useInstance = (instanceId: string | null) => {
  const instanceData=useQuery({
    queryKey: ['instance', instanceId],
    queryFn: () => instanceId ? fetchInstance(instanceId) : null,
    enabled: !!instanceId && instanceId !== '',
    staleTime: 10 * 60 * 1000, // 10 minutes
  });


  return instanceData;
};


// Mutation hook for loading text content from a specific instance
export const useLoadTextContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (instanceId: string): Promise<{ instanceId: string; content: string }> => {
      const textInstance = await fetchInstance(instanceId);
      const content = textInstance.base || 'No content available';
      return { instanceId, content };
    },
    onSuccess: (data) => {
      // Cache the text instance data
      queryClient.setQueryData(['instance', data.instanceId], (oldData: OpenPechaTextInstance | undefined) => {
        if (oldData) return oldData;
        return { base: data.content } as OpenPechaTextInstance;
      });
    },
  });
};
