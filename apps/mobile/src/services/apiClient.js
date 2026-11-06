/**
 * API CLIENT
 * Handles all communication with Kuneo Gateway
 */

import axios from 'axios';
import Constants from 'expo-constants';
import { supabase } from './supabaseClient';

const GATEWAY_URL = Constants.expoConfig?.extra?.gatewayUrl || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: `${GATEWAY_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============================================
// TUTOR API
// ============================================

export const tutorAPI = {
  /**
   * Send message to tutor
   */
  interact: async (sessionId, moduleId, userMessage, userAction = null, context = {}) => {
    const response = await apiClient.post('/tutor/interact', {
      session_id: sessionId,
      module_id: moduleId,
      user_message: userMessage,
      user_action: userAction,
      context
    });
    return response.data;
  },

  /**
   * Start new learning session
   */
  startSession: async (moduleId) => {
    const response = await apiClient.post('/tutor/session/start', {
      module_id: moduleId
    });
    return response.data;
  },

  /**
   * Complete session
   */
  completeSession: async (sessionId) => {
    const response = await apiClient.post(`/tutor/session/${sessionId}/complete`);
    return response.data;
  }
};

// ============================================
// CONTENT API
// ============================================

export const contentAPI = {
  /**
   * Get all modules
   */
  getModules: async (gradeLevel = null, subject = null) => {
    const response = await apiClient.get('/content/modules', {
      params: { gradeLevel, subject }
    });
    return response.data;
  },

  /**
   * Get module by ID
   */
  getModule: async (moduleId) => {
    const response = await apiClient.get(`/content/modules/${moduleId}`);
    return response.data;
  }
};

// ============================================
// PROGRESS API
// ============================================

export const progressAPI = {
  /**
   * Get user progress
   */
  getProgress: async () => {
    const response = await apiClient.get('/progress');
    return response.data;
  },

  /**
   * Get progress summary
   */
  getSummary: async () => {
    const response = await apiClient.get('/progress/summary');
    return response.data;
  }
};

// ============================================
// RECOMMENDATIONS API
// ============================================

export const recommendationsAPI = {
  /**
   * Get active recommendations
   */
  getRecommendations: async () => {
    const response = await apiClient.get('/recommendations');
    return response.data;
  },

  /**
   * Generate new recommendations
   */
  generateRecommendations: async () => {
    const response = await apiClient.post('/recommendations/generate');
    return response.data;
  }
};

// ============================================
// ICFES API
// ============================================

export const icfesAPI = {
  /**
   * Generate ICFES test
   */
  generateTest: async (subject, questionCount = 20) => {
    const response = await apiClient.post('/icfes/generate', {
      subject,
      questionCount
    });
    return response.data;
  },

  /**
   * Submit ICFES attempt
   */
  submitAttempt: async (subject, answers, questions, durationSeconds) => {
    const response = await apiClient.post('/icfes/submit', {
      subject,
      answers,
      questions,
      duration_seconds: durationSeconds
    });
    return response.data;
  },

  /**
   * Get user's ICFES attempts
   */
  getAttempts: async (subject = null) => {
    const response = await apiClient.get('/icfes/attempts', {
      params: { subject }
    });
    return response.data;
  }
};

export default apiClient;
