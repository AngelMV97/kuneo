/**
 * LEARNING SCREEN
 * Main tutor interaction screen
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tutorAPI } from '../services/apiClient';
import { renderTutorResponse } from '../engine/renderer';

export default function LearningScreen({ route }) {
  const { moduleId } = route.params;
  const [session, setSession] = useState(null);
  const [tutorResponse, setTutorResponse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startSession();
  }, []);

  const startSession = async () => {
    try {
      const newSession = await tutorAPI.startSession(moduleId);
      setSession(newSession);
      
      // Get initial tutor greeting
      const response = await tutorAPI.interact(
        newSession.id,
        moduleId,
        null,
        'start',
        { gradeLevel: 6, subject: 'matematicas' }
      );
      setTutorResponse(response);
    } catch (error) {
      console.error('Error starting session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    setLoading(true);
    try {
      const response = await tutorAPI.interact(
        session.id,
        moduleId,
        action.value || action.label,
        action.type,
        { gradeLevel: 6, subject: 'matematicas' }
      );
      setTutorResponse(response);
    } catch (error) {
      console.error('Error handling action:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !tutorResponse) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {renderTutorResponse(tutorResponse, handleAction)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  scrollView: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
