/**
 * ACTION BUTTON COMPONENT
 * Buttons for tutor actions (hints, suggestions, etc.)
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function ActionButton({ label, type, onPress }) {
  const getButtonStyle = () => {
    switch (type) {
      case 'hint':
        return styles.hintButton;
      case 'suggestion':
        return styles.suggestionButton;
      case 'submit':
        return styles.submitButton;
      default:
        return styles.defaultButton;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle()]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8
  },
  defaultButton: {
    backgroundColor: '#E2E8F0',
  },
  hintButton: {
    backgroundColor: '#FED7AA',
  },
  suggestionButton: {
    backgroundColor: '#BFDBFE',
  },
  submitButton: {
    backgroundColor: '#4A90E2',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3748'
  }
});
