import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from './useDebounce';
import { searchCandidates } from '@/lib/api';
import type { SearchCandidate } from '@/types';

export function useSearchSource() {
  const [keyword, setKeyword] = useState('');
  const [candidates, setCandidates] = useState<SearchCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedKeyword = useDebounce(keyword, 500);

  useEffect(() => {
    if (!debouncedKeyword.trim()) {
      setCandidates([]);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await searchCandidates(debouncedKeyword, 'netease');
        if (!cancelled) {
          setCandidates(
            response.items.map((item) => ({
              source: item.source,
              externalId: item.external_id,
              name: item.name,
              singer: item.singer,
              cover: item.cover,
              album: item.album,
            }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '搜索失败');
          setCandidates([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [debouncedKeyword]);

  const reset = useCallback(() => {
    setKeyword('');
    setCandidates([]);
    setError(null);
  }, []);

  return {
    keyword,
    setKeyword,
    candidates,
    isLoading,
    error,
    reset,
  };
}
