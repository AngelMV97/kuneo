/**
 * HOME SCREEN
 * Dashboard with modules and recommendations
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🐻 Hola, estudiante!</Text>
        <Text style={styles.subtitle}>¿Qué vamos a aprender hoy?</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  content: {
    flex: 1,
    padding: 24
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 18,
    color: '#4A5568'
  }
});
