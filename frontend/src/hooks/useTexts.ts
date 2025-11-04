import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTexts, fetchTextInstances } from '../api/text';
import type { OpenPechaText, OpenPechaTextInstance } from '../types/text';
import { root_text } from '../data/text';
// Query keys
export const textKeys = {
  all: ['texts'] as const,
  lists: () => [...textKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...textKeys.lists(), { filters }] as const,
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
export const useTextInstances = (textId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: textKeys.instances(textId),
    queryFn: () => fetchTextInstances(textId),
    enabled: enabled && !!textId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Mutation hook for loading text content
export const useLoadTextContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (textId: string): Promise<{ textId: string; content: string }> => {
      const textInstance = await fetchTextInstances(textId);
      const content = textInstance.base ||root_text;
      return { textId, content };
    },
    onSuccess: (data) => {
      // Cache the text instance data
      queryClient.setQueryData(textKeys.instances(data.textId), (oldData: OpenPechaTextInstance | undefined) => {
        if (oldData) return oldData;
        return { base: data.content } as OpenPechaTextInstance;
      });
    },
  });
};
