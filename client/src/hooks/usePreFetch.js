// client/src/hooks/usePreFetch.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch, API_BASE } from '../utils/learningApi';

/**
 * Hook for pre-fetching next step data
 * Loads the next step in background while user answers current step
 */
export function usePreFetch() {
  const [preFetchedData, setPreFetchedData] = useState(new Map());
  const [isPreFetching, setIsPreFetching] = useState(false);
  const abortControllerRef = useRef(null);

  /**
   * Pre-fetch next step data
   */
  const preFetchNextStep = useCallback(async (moduleId, currentStepOrder, userId) => {
    if (!moduleId || currentStepOrder === undefined) return;

    const nextStepOrder = currentStepOrder + 1;
    const cacheKey = `${moduleId}-${nextStepOrder}`;

    // Check if already cached
    if (preFetchedData.has(cacheKey)) {
      return preFetchedData.get(cacheKey);
    }

    // Cancel any existing pre-fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setIsPreFetching(true);

      // Pre-fetch next step (this would be an API call)
      // For now, we'll simulate the structure
      const response = await apiFetch(
        `${API_BASE}/api/prefetch-step?module_id=${moduleId}&step_order=${nextStepOrder}&user_id=${userId}`,
        { 
          signal: abortControllerRef.current.signal,
          method: 'GET'
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Cache the pre-fetched data
        setPreFetchedData(prev => new Map(prev).set(cacheKey, data));
        
        return data;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Pre-fetch aborted');
      } else {
        console.error('Pre-fetch error:', error);
      }
    } finally {
      setIsPreFetching(false);
    }

    return null;
  }, [preFetchedData]);

  /**
   * Get pre-fetched data if available
   */
  const getPreFetched = useCallback((moduleId, stepOrder) => {
    const cacheKey = `${moduleId}-${stepOrder}`;
    return preFetchedData.get(cacheKey);
  }, [preFetchedData]);

  /**
   * Clear pre-fetch cache
   */
  const clearPreFetchCache = useCallback(() => {
    setPreFetchedData(new Map());
  }, []);

  /**
   * Cancel ongoing pre-fetch
   */
  const cancelPreFetch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsPreFetching(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPreFetch();
    };
  }, [cancelPreFetch]);

  return {
    preFetchNextStep,
    getPreFetched,
    clearPreFetchCache,
    cancelPreFetch,
    isPreFetching,
    hasCachedData: preFetchedData.size > 0
  };
}
