/**
 * MESSAGE BUBBLE COMPONENT
 * Displays tutor messages
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MessageBubble({ message, variant = 'tutor' }) {
  const isUser = variant === 'user';

  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.tutorContainer
    ]}>
      <Text style={[
        styles.text,
        isUser ? styles.userText : styles.tutorText
      ]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%'
  },
  tutorContainer: {
    backgroundColor: '#F0F4F8',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4
  },
  userContainer: {
    backgroundColor: '#4A90E2',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4
  },
  text: {
    fontSize: 16,
    lineHeight: 22
  },
  tutorText: {
    color: '#2D3748'
  },
  userText: {
    color: '#FFFFFF'
  }
});
