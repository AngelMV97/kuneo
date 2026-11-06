/**
 * INPUT FIELD COMPONENT
 * User input for tutor interaction
 */

import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function InputField({ placeholder = 'Escribe tu respuesta...', onSubmit }) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text);
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={text}
        onChangeText={setText}
        multiline
        onSubmitEditing={handleSubmit}
      />
      <TouchableOpacity
        style={[styles.button, !text.trim() && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!text.trim()}
      >
        <Text style={styles.buttonText}>Enviar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF'
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center'
  },
  buttonDisabled: {
    backgroundColor: '#A0AEC0'
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16
  }
});
