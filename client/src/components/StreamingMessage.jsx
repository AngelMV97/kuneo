// client/src/components/StreamingMessage.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Component that shows text with a streaming/typing effect
 * Gives the perception of faster response
 */
export function StreamingMessage({ message, onComplete, speed = 30 }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!message) {
      setDisplayedText('');
      setIsComplete(false);
      return;
    }

    // For short messages, show immediately
    if (message.length < 20) {
      setDisplayedText(message);
      setIsComplete(true);
      onComplete?.();
      return;
    }

    // Stream longer messages
    let currentIndex = 0;
    setDisplayedText('');
    setIsComplete(false);

    const interval = setInterval(() => {
      if (currentIndex < message.length) {
        setDisplayedText(message.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [message, speed, onComplete]);

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-white text-lg font-medium text-center"
    >
      {displayedText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block ml-1"
        >
          ▌
        </motion.span>
      )}
    </motion.p>
  );
}

/**
 * Component that progressively reveals intervention sections
 * Tuko → Message → Concept Card
 */
export function StreamingIntervention({ intervention, onComplete }) {
  const [stage, setStage] = useState(0);
  
  useEffect(() => {
    // Progress through stages with delays
    const timers = [];
    
    if (intervention.show_tuko) {
      timers.push(setTimeout(() => setStage(1), 100)); // Show Tuko immediately
      timers.push(setTimeout(() => setStage(2), 300)); // Show message after 300ms
    } else {
      timers.push(setTimeout(() => setStage(2), 100)); // Skip to message
    }

    if (intervention.card_variant) {
      timers.push(setTimeout(() => setStage(3), 800)); // Show concept card after 800ms
    }

    // Complete after all stages
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 1200);
    timers.push(completeTimer);

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [intervention, onComplete]);

  return {
    showTuko: stage >= 1,
    showMessage: stage >= 2,
    showConceptCard: stage >= 3
  };
}
