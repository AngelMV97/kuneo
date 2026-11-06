import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { profiles } from '../utils/kuneoApi';
import { supabase } from '../supabaseClient';

/**
 * CharacterSelection - Selección de personaje guía
 * Aparece después del registro, antes del onboarding
 */
const CharacterSelection = () => {
  const navigate = useNavigate();
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const characters = [
    {
      id: 'tuko',
      name: 'Tuko',
      animal: 'Oso de anteojos',
      description: 'Curioso y analítico, perfecto para explorar conceptos complejos',
      color: 'from-brown-400 to-amber-600',
      available: true
    },
    {
      id: 'pico',
      name: 'Pico',
      animal: 'Tucán',
      description: 'Colorido y expresivo, ideal para aprender de forma visual',
      color: 'from-yellow-400 to-orange-500',
      available: true
    },
    {
      id: 'yagui',
      name: 'Yagui',
      animal: 'Jaguar',
      description: 'Ágil y estratégico, excelente para resolver problemas',
      color: 'from-yellow-600 to-orange-700',
      available: true
    },
    {
      id: 'rosi',
      name: 'Rosi',
      animal: 'Delfín rosado',
      description: 'Amigable y empático, perfecto para reflexionar juntos',
      color: 'from-pink-400 to-rose-500',
      available: true
    },
    {
      id: 'guido',
      name: 'Guido',
      animal: 'Chigüiro',
      description: 'Tranquilo y constante, ideal para aprendizaje paso a paso',
      color: 'from-amber-500 to-brown-600',
      available: true
    }
  ];

  const handleSelect = (characterId) => {
    setSelectedCharacter(characterId);
  };

  const handleContinue = async () => {
    if (!selectedCharacter) return;

    setIsSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Update character preference using RPC function
      const { data, error } = await supabase.rpc('kuneo_update_character_preference', {
        p_user_id: user.id,
        p_character: selectedCharacter.toLowerCase()
      });

      if (error) {
        console.error('Error updating character:', error);
        throw new Error(error.message);
      }

      console.log('Character preference updated:', data);
      
      // Redirigir al catalog
      navigate('/catalog');
    } catch (err) {
      console.error('Error saving character preference:', err);
      setError('Error al guardar preferencia. Por favor intenta de nuevo.');
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#13172a] py-12 px-4 overflow-x-hidden">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-3">
            Elige tu compañero de aprendizaje
          </h1>
          <p className="text-gray-400">
            Será tu guía en este viaje de descubrimiento
          </p>
        </motion.div>

        {/* Grid de personajes - 2 columnas en móvil, 2 en tablet, 3 en desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {characters.map((character, index) => (
            <motion.button
              key={character.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSelect(character.id)}
              disabled={!character.available}
              className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300
                        ${selectedCharacter === character.id 
                          ? 'ring-4 ring-purple-500 scale-105 shadow-2xl shadow-purple-500/20' 
                          : 'hover:scale-105 shadow-lg'}
                        ${!character.available && 'opacity-50 cursor-not-allowed'}
                        bg-[#1e2439]`}
            >
              {/* Character image */}
              <div className="relative z-10 mb-3">
                <img
                  src={`/image/characters/${character.id}-torso.png`}
                  alt={character.name}
                  className="w-full h-32 object-contain rounded-full"
                  onError={(e) => {
                    // Fallback si no existe la imagen
                    e.target.src = '/image/characters/tuko-torso.png';
                  }}
                />
              </div>

              {/* Character info */}
              <div className="relative z-10 text-center">
                <h3 className="text-lg font-bold text-white mb-1">
                  {character.name}
                </h3>
                <p className="text-xs text-gray-400 mb-2">
                  {character.animal}
                </p>
                <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
                  {character.description}
                </p>
              </div>

              {/* Selected indicator */}
              {selectedCharacter === character.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-8 h-8 bg-purple-500 rounded-full 
                           flex items-center justify-center shadow-lg"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </motion.div>
              )}

              {/* Coming soon badge */}
              {!character.available && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-gray-600 rounded-full text-white text-xs font-bold">
                  Próximamente
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Continue button */}
        {selectedCharacter && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {error && (
              <p className="text-red-400 mb-4 font-medium text-sm">{error}</p>
            )}
            <button
              onClick={handleContinue}
              disabled={isSaving}
              className="px-10 py-3 bg-gradient-to-r from-purple-600 via-purple-500 to-orange-400 
                       hover:from-purple-700 hover:via-purple-600 hover:to-orange-500
                       text-white text-lg font-bold rounded-2xl shadow-lg
                       transition-all duration-200 transform hover:scale-105
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (
                `Continuar con ${characters.find(c => c.id === selectedCharacter)?.name} →`
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CharacterSelection;
