import { apiFetch } from './learningApi';
/**
 * KUNEO API CLIENT
 * Cliente centralizado para comunicación con el backend
 */

import { supabase } from '../supabaseClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Helper para obtener userId de sesión actual
 */
async function getCurrentUserId() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id;
}

/**
 * ====================================
 * ORCHESTRATOR API
 * ====================================
 */

export const orchestrator = {
  /**
   * Iniciar nueva sesión de módulo
   */
  async startSession(moduleId) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('No hay sesión activa');

    const response = await apiFetch(`${API_BASE}/api/orchestrator/start-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, moduleId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error iniciando sesión');
    }

    return response.json();
  },

  /**
   * Enviar respuesta del usuario y obtener siguiente acción
   */
  async decide(sessionId, userResponse, currentPhase, context = {}) {
    const response = await apiFetch(`${API_BASE}/api/orchestrator/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        userResponse,
        currentPhase,
        context
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error procesando decisión');
    }

    return response.json();
  },

  /**
   * Finalizar sesión y obtener feedback
   */
  async endSession(sessionId) {
    const response = await apiFetch(`${API_BASE}/api/orchestrator/end-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error finalizando sesión');
    }

    return response.json();
  }
};

/**
 * ====================================
 * MODULES API
 * ====================================
 */

export const modules = {
  /**
   * Obtener lista de módulos
   */
  async getModules(subject = null, gradeLevel = null) {
    const userId = await getCurrentUserId();
    const params = new URLSearchParams();
    
    if (subject) params.append('subject', subject);
    if (gradeLevel) params.append('grade', gradeLevel); // Backend espera 'grade' no 'gradeLevel'
    if (userId) params.append('userId', userId);

    const response = await apiFetch(`${API_BASE}/api/modules?${params}`);
    
    if (!response.ok) {
      throw new Error('Error obteniendo módulos');
    }

    return response.json();
  },

  /**
   * Obtener detalle de módulo específico
   */
  async getModule(moduleId) {
    const response = await apiFetch(`${API_BASE}/api/modules/${moduleId}`);
    
    if (!response.ok) {
      throw new Error('Error obteniendo módulo');
    }

    return response.json();
  },

  /**
   * Obtener steps de un módulo con enriched_content
   */
  async getModuleSteps(moduleId) {
    const response = await apiFetch(`${API_BASE}/api/modules/${moduleId}/steps`);
    
    if (!response.ok) {
      throw new Error('Error obteniendo steps del módulo');
    }

    return response.json();
  },

  /**
   * Obtener lista de asignaturas
   */
  async getSubjects() {
    const response = await apiFetch(`${API_BASE}/api/subjects`);
    
    if (!response.ok) {
      throw new Error('Error obteniendo asignaturas');
    }

    return response.json();
  }
};

/**
 * ====================================
 * PROGRESS API
 * ====================================
 */

export const progress = {
  /**
   * Obtener progreso completo del usuario
   */
  async getProgress() {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('No hay sesión activa');

    const response = await apiFetch(`${API_BASE}/api/progress/${userId}`);
    
    if (!response.ok) {
      throw new Error('Error obteniendo progreso');
    }

    return response.json();
  },

  /**
   * Obtener perfil cognitivo detallado
   */
  async getCognitiveProfile() {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('No hay sesión activa');

    const response = await apiFetch(`${API_BASE}/api/cognitive-profile/${userId}`);
    
    if (!response.ok) {
      throw new Error('Error obteniendo perfil cognitivo');
    }

    return response.json();
  },

  /**
   * Obtener feedback de sesión específica
   */
  async getSessionFeedback(sessionId) {
    const response = await apiFetch(`${API_BASE}/api/sessions/${sessionId}/feedback`);
    
    if (!response.ok) {
      throw new Error('Error obteniendo feedback');
    }

    return response.json();
  }
};

/**
 * ====================================
 * PROFILES API
 * ====================================
 */

export const profiles = {
  /**
   * Obtener perfil del usuario
   */
  async getProfile() {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('No hay sesión activa');

    const response = await apiFetch(`${API_BASE}/api/profiles/${userId}`);
    
    if (!response.ok) {
      throw new Error('Error obteniendo perfil');
    }

    return response.json();
  },

  /**
   * Actualizar perfil
   */
  async updateProfile(updates) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('No hay sesión activa');

    const response = await apiFetch(`${API_BASE}/api/profiles/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error actualizando perfil');
    }

    return response.json();
  },

  /**
   * Guardar preferencia de personaje
   */
  async saveCharacterPreference(character) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('No hay sesión activa');

    const response = await apiFetch(`${API_BASE}/api/profiles/character-preference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, character })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error guardando preferencia');
    }

    return response.json();
  },

  /**
   * Inicializar perfil de nuevo usuario
   */
  async initializeProfile(data) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('No hay sesión activa');

    const response = await apiFetch(`${API_BASE}/api/profiles/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, userId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error inicializando perfil');
    }

    return response.json();
  },

  /**
   * Obtener módulo donde el usuario debe continuar
   */
  async getContinueLearning() {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('No hay sesión activa');

    const response = await apiFetch(`${API_BASE}/api/profiles/${userId}/continue-learning`);
    
    if (!response.ok) {
      throw new Error('Error obteniendo continue-learning');
    }

    return response.json();
  }
};

/**
 * ====================================
 * COMPETENCIES API
 * ====================================
 */

export const competencies = {
  /**
   * Búsqueda semántica de competency units
   */
  async search(query, filters = {}, options = {}) {
    const response = await apiFetch(`${API_BASE}/api/competencies/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        filters,
          match_threshold: options.threshold ?? 0.5,
          match_count: options.limit ?? 20,
          offset: options.offset ?? 0
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en búsqueda semántica');
    }

    return response.json();
  },

  /**
   * Obtener competency units con filtros (sin búsqueda semántica)
   */
  async getByFilters(filters = {}, limit = 50) {
    const params = new URLSearchParams({
      ...filters,
      limit: limit.toString()
    });

    // Filtrar undefined values
    for (const [key, value] of params.entries()) {
      if (value === 'undefined' || value === 'null') {
        params.delete(key);
      }
    }

    const response = await apiFetch(`${API_BASE}/api/competencies/filters?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error obteniendo competencies');
    }

    return response.json();
  },

  /**
   * Obtener un competency unit específico por ID
   */
  async getById(id) {
    const response = await apiFetch(`${API_BASE}/api/competencies/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error obteniendo competency');
    }

    return response.json();
  }
};

export default {
  orchestrator,
  modules,
  progress,
  profiles,
  competencies
};
