/**
 * Profile Events - Sistema de eventos para sincronizar el perfil del usuario
 * entre diferentes componentes y páginas
 */

export const PROFILE_UPDATED_EVENT = 'kuneo:profile:updated';

/**
 * Emitir evento cuando el perfil se actualiza
 */
export function emitProfileUpdated(profile) {
  const event = new CustomEvent(PROFILE_UPDATED_EVENT, {
    detail: { profile }
  });
  window.dispatchEvent(event);
}

/**
 * Escuchar cambios en el perfil
 */
export function onProfileUpdated(callback) {
  const handler = (event) => {
    callback(event.detail.profile);
  };
  window.addEventListener(PROFILE_UPDATED_EVENT, handler);
  
  // Return cleanup function
  return () => {
    window.removeEventListener(PROFILE_UPDATED_EVENT, handler);
  };
}
