/**
 * CARD COMPONENT
 * Displays concepts, exercises, hints, feedback
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Card({ type, title, content }) {
  const getCardStyle = () => {
    switch (type) {
      case 'concept':
        return styles.conceptCard;
      case 'exercise':
        return styles.exerciseCard;
      case 'hint':
        return styles.hintCard;
      case 'feedback':
        return styles.feedbackCard;
      default:
        return styles.defaultCard;
    }
  };

  return (
    <View style={[styles.card, getCardStyle()]}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Text style={styles.content}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    borderLeftWidth: 4
  },
  defaultCard: {
    backgroundColor: '#F7FAFC',
    borderLeftColor: '#CBD5E0'
  },
  conceptCard: {
    backgroundColor: '#EBF8FF',
    borderLeftColor: '#4299E1'
  },
  exerciseCard: {
    backgroundColor: '#F0FFF4',
    borderLeftColor: '#48BB78'
  },
  hintCard: {
    backgroundColor: '#FFFAF0',
    borderLeftColor: '#ED8936'
  },
  feedbackCard: {
    backgroundColor: '#FAF5FF',
    borderLeftColor: '#9F7AEA'
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8
  },
  content: {
    fontSize: 15,
    lineHeight: 21,
    color: '#4A5568'
  }
});
