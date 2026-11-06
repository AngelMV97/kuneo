import { useState, useEffect, useCallback } from 'react';

/**
 * A/B Testing Framework para UX Optimizations
 * Permite comparar experiencia con/sin optimizaciones UX
 * 
 * Grupos:
 * - Group A (Control): Sin optimizaciones UX
 * - Group B (Treatment): Con optimizaciones UX completas
 */

const AB_TEST_KEY = 'kuneo_ab_test_group';
const AB_METRICS_KEY = 'kuneo_ab_test_metrics';

export function useABTest() {
  const [testGroup, setTestGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [abMetrics, setAbMetrics] = useState({
    groupA: {
      sessions: 0,
      totalResponses: 0,
      avgResponseTime: 0,
      userSatisfaction: 0,
      completionRate: 0,
    },
    groupB: {
      sessions: 0,
      totalResponses: 0,
      avgResponseTime: 0,
      userSatisfaction: 0,
      completionRate: 0,
    },
  });

  // Initialize test group on mount
  useEffect(() => {
    initializeTestGroup();
    loadMetrics();
  }, []);

  const initializeTestGroup = useCallback(() => {
    // Check if user already has a test group assigned
    const savedGroup = localStorage.getItem(AB_TEST_KEY);
    
    if (savedGroup && (savedGroup === 'A' || savedGroup === 'B')) {
      setTestGroup(savedGroup);
    } else {
      // Randomly assign user to group A or B (50/50 split)
      const randomGroup = Math.random() < 0.5 ? 'A' : 'B';
      localStorage.setItem(AB_TEST_KEY, randomGroup);
      setTestGroup(randomGroup);
      
      // Increment session count for this group
      incrementSessionCount(randomGroup);
    }
    
    setIsLoading(false);
  }, []);

  const loadMetrics = useCallback(() => {
    const saved = localStorage.getItem(AB_METRICS_KEY);
    if (saved) {
      try {
        setAbMetrics(JSON.parse(saved));
      } catch (err) {
        console.error('Error loading A/B metrics:', err);
      }
    }
  }, []);

  const saveMetrics = useCallback((newMetrics) => {
    localStorage.setItem(AB_METRICS_KEY, JSON.stringify(newMetrics));
    setAbMetrics(newMetrics);
  }, []);

  const incrementSessionCount = useCallback((group) => {
    const saved = localStorage.getItem(AB_METRICS_KEY);
    let metrics = abMetrics;
    
    if (saved) {
      try {
        metrics = JSON.parse(saved);
      } catch (err) {
        console.error('Error parsing metrics:', err);
      }
    }
    
    const groupKey = `group${group}`;
    metrics[groupKey].sessions += 1;
    saveMetrics(metrics);
  }, [abMetrics, saveMetrics]);

  // Track response time
  const trackResponseTime = useCallback((responseTime) => {
    if (!testGroup) return;
    
    const groupKey = `group${testGroup}`;
    const current = abMetrics[groupKey];
    
    const newTotal = current.totalResponses + 1;
    const newAvg = ((current.avgResponseTime * current.totalResponses) + responseTime) / newTotal;
    
    const newMetrics = {
      ...abMetrics,
      [groupKey]: {
        ...current,
        totalResponses: newTotal,
        avgResponseTime: newAvg,
      },
    };
    
    saveMetrics(newMetrics);
  }, [testGroup, abMetrics, saveMetrics]);

  // Track user satisfaction (1-5 scale)
  const trackSatisfaction = useCallback((rating) => {
    if (!testGroup || rating < 1 || rating > 5) return;
    
    const groupKey = `group${testGroup}`;
    const current = abMetrics[groupKey];
    
    // Calculate new average satisfaction
    const totalRatings = current.sessions; // Assuming one rating per session
    const newAvg = ((current.userSatisfaction * (totalRatings - 1)) + rating) / totalRatings;
    
    const newMetrics = {
      ...abMetrics,
      [groupKey]: {
        ...current,
        userSatisfaction: newAvg,
      },
    };
    
    saveMetrics(newMetrics);
  }, [testGroup, abMetrics, saveMetrics]);

  // Track module completion
  const trackCompletion = useCallback((completed) => {
    if (!testGroup) return;
    
    const groupKey = `group${testGroup}`;
    const current = abMetrics[groupKey];
    
    const completions = completed ? 1 : 0;
    const newRate = ((current.completionRate * (current.sessions - 1)) + completions) / current.sessions;
    
    const newMetrics = {
      ...abMetrics,
      [groupKey]: {
        ...current,
        completionRate: newRate * 100, // Percentage
      },
    };
    
    saveMetrics(newMetrics);
  }, [testGroup, abMetrics, saveMetrics]);

  // Get configuration based on test group
  const getConfig = useCallback(() => {
    if (testGroup === 'A') {
      // Group A: Control - No UX optimizations
      return {
        enableOptimisticUI: false,
        enablePreFetch: false,
        enableStreaming: false,
        enableEnhancedSkeletons: false,
        groupName: 'Control (Sin optimizaciones)',
      };
    } else if (testGroup === 'B') {
      // Group B: Treatment - All UX optimizations enabled
      return {
        enableOptimisticUI: true,
        enablePreFetch: true,
        enableStreaming: true,
        enableEnhancedSkeletons: true,
        groupName: 'Treatment (Con optimizaciones)',
      };
    }
    
    // Default: enable all (fallback)
    return {
      enableOptimisticUI: true,
      enablePreFetch: true,
      enableStreaming: true,
      enableEnhancedSkeletons: true,
      groupName: 'Default',
    };
  }, [testGroup]);

  // Override test group (for testing/debugging only)
  const overrideTestGroup = useCallback((group) => {
    if (group === 'A' || group === 'B') {
      localStorage.setItem(AB_TEST_KEY, group);
      setTestGroup(group);
      incrementSessionCount(group);
    }
  }, [incrementSessionCount]);

  // Reset test (clear group assignment and metrics)
  const resetTest = useCallback(() => {
    localStorage.removeItem(AB_TEST_KEY);
    localStorage.removeItem(AB_METRICS_KEY);
    setTestGroup(null);
    setAbMetrics({
      groupA: {
        sessions: 0,
        totalResponses: 0,
        avgResponseTime: 0,
        userSatisfaction: 0,
        completionRate: 0,
      },
      groupB: {
        sessions: 0,
        totalResponses: 0,
        avgResponseTime: 0,
        userSatisfaction: 0,
        completionRate: 0,
      },
    });
    initializeTestGroup();
  }, [initializeTestGroup]);

  // Export results for analysis
  const exportResults = useCallback(() => {
    const results = {
      testGroup,
      metrics: abMetrics,
      comparison: {
        responseTimeImprovement: calculateImprovement(
          abMetrics.groupA.avgResponseTime,
          abMetrics.groupB.avgResponseTime
        ),
        satisfactionImprovement: calculateImprovement(
          abMetrics.groupA.userSatisfaction,
          abMetrics.groupB.userSatisfaction,
          true // higher is better
        ),
        completionImprovement: calculateImprovement(
          abMetrics.groupA.completionRate,
          abMetrics.groupB.completionRate,
          true
        ),
      },
      timestamp: new Date().toISOString(),
    };
    
    console.log('📊 A/B Test Results:', results);
    return results;
  }, [testGroup, abMetrics]);

  // Calculate percentage improvement
  const calculateImprovement = (baseline, treatment, higherIsBetter = false) => {
    if (baseline === 0) return 0;
    
    const change = treatment - baseline;
    const percentChange = (change / baseline) * 100;
    
    // If lower is better (e.g., response time), invert the sign
    return higherIsBetter ? percentChange : -percentChange;
  };

  return {
    testGroup,
    isLoading,
    config: getConfig(),
    metrics: abMetrics,
    trackResponseTime,
    trackSatisfaction,
    trackCompletion,
    overrideTestGroup,
    resetTest,
    exportResults,
  };
}
