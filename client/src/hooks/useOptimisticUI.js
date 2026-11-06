// client/src/hooks/useOptimisticUI.js
import { useState, useCallback } from 'react';

/**
 * Hook for optimistic UI updates
 * Shows immediate feedback before backend response
 */
export function useOptimisticUI() {
  const [optimisticState, setOptimisticState] = useState({
    isActive: false,
    feedback: null,
    predictedCorrect: null
  });

  /**
   * Analyze user answer to predict if it's likely correct
   * This is a simple heuristic for immediate feedback
   */
  const predictAnswer = useCallback((answer, expectedAnswer) => {
    if (!answer || !expectedAnswer) return null;

    const answerLower = answer.toLowerCase().trim();
    
    // Check if answer has minimum length (not too short)
    if (answerLower.length < 3) return false;

    // If expected_answer has keywords, check for them
    if (expectedAnswer.type === 'keywords') {
      const hasRequired = expectedAnswer.required_keywords?.some(keyword => 
        answerLower.includes(keyword.toLowerCase())
      );
      return hasRequired ? true : null; // true if found, null if uncertain
    }

    // If expected_answer has exact match
    if (expectedAnswer.type === 'exact' && expectedAnswer.correct_option !== undefined) {
      return answerLower === expectedAnswer.correct_option.toString().toLowerCase();
    }

    // For numeric answers
    if (expectedAnswer.type === 'numeric' && expectedAnswer.correct_value !== undefined) {
      const numAnswer = parseFloat(answerLower);
      return !isNaN(numAnswer) && Math.abs(numAnswer - expectedAnswer.correct_value) < 0.01;
    }

    // Unknown - return null (uncertain)
    return null;
  }, []);

  /**
   * Show optimistic feedback immediately
   */
  const showOptimisticFeedback = useCallback((answer, expectedAnswer) => {
    const predicted = predictAnswer(answer, expectedAnswer);
    
    let feedback = {
      message: '🤔 Evaluando tu respuesta...',
      tukoState: 'thinking',
      showTuko: true
    };

    // If we're confident, show positive feedback
    if (predicted === true) {
      feedback = {
        message: '¡Muy bien! ✨',
        tukoState: 'correct',
        showTuko: true
      };
    }

    setOptimisticState({
      isActive: true,
      feedback,
      predictedCorrect: predicted
    });

    return predicted;
  }, [predictAnswer]);

  /**
   * Resolve optimistic state with actual backend result
   */
  const resolveOptimistic = useCallback((actualResult) => {
    setOptimisticState({
      isActive: false,
      feedback: null,
      predictedCorrect: null
    });
  }, []);

  /**
   * Clear optimistic state
   */
  const clearOptimistic = useCallback(() => {
    setOptimisticState({
      isActive: false,
      feedback: null,
      predictedCorrect: null
    });
  }, []);

  return {
    optimisticState,
    showOptimisticFeedback,
    resolveOptimistic,
    clearOptimistic
  };
}
