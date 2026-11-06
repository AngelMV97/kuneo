/**
 * TUKO CHARACTER COMPONENT
 * Displays Tuko with Lottie animations
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { getLottieFilePath, getStateByContext } from '../../../../shared/ui-schema/characterStates';

const WINDOW_WIDTH = Dimensions.get('window').width;

export default function TukoCharacter({ state = 'idle', character = 'tuko', size = 200 }) {
  const characterState = getStateByContext(state);
  const lottiePath = getLottieFilePath(state, character);
  
  // Require necesita ruta relativa - ajustar según estructura
  // Por ahora usamos fallback si no existe el archivo
  let lottieSource;
  try {
    lottieSource = require(`../../../../public/lottie/characters/${character}/${characterState.lottie_file}`);
  } catch (error) {
    console.warn(`Lottie file not found: ${lottiePath}. Using placeholder.`);
    // Usar animación placeholder o imagen estática
    lottieSource = null;
  }

  if (!lottieSource) {
    // Placeholder mientras se crean las animaciones
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🐻</Text>
          <Text style={styles.placeholderLabel}>{characterState.name}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <LottieView
        source={lottieSource}
        autoPlay
        loop={characterState.loop}
        style={styles.animation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center'
  },
  animation: {
    width: '100%',
    height: '100%'
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: 100
  },
  placeholderText: {
    fontSize: 80
  },
  placeholderLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 8
  }
});
