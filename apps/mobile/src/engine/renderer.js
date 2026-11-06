/**
 * TUTOR RESPONSE RENDERER
 * Renders TutorResponse objects as React Native components
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TukoCharacter from '../components/TukoCharacter';
import MessageBubble from '../components/MessageBubble';
import InputField from '../components/InputField';
import ActionButton from '../components/ActionButton';
import Card from '../components/Card';

/**
 * Render TutorResponse
 * @param {Object} tutorResponse - TutorResponse from backend
 * @param {Function} onAction - Action handler
 * @returns {JSX.Element} Rendered UI
 */
export function renderTutorResponse(tutorResponse, onAction) {
  if (!tutorResponse) {
    return <Text>Cargando...</Text>;
  }

  const {
    character_state,
    message,
    ui_elements = [],
    cards = [],
    actions = []
  } = tutorResponse;

  return (
    <View style={styles.container}>
      {/* Tuko Character Animation */}
      <TukoCharacter state={character_state} />

      {/* Message Bubble */}
      {message && (
        <MessageBubble
          message={message}
          variant={ui_elements.find(el => el.type === 'bubble')?.props?.variant || 'tutor'}
        />
      )}

      {/* Cards (concepts, exercises, hints, etc.) */}
      {cards.map((card, index) => (
        <Card
          key={`card-${index}`}
          type={card.type}
          title={card.title}
          content={card.content}
        />
      ))}

      {/* UI Elements (input, options, etc.) */}
      {ui_elements.map((element, index) => {
        if (element.type === 'input') {
          return (
            <InputField
              key={`input-${index}`}
              placeholder={element.props?.placeholder}
              onSubmit={(text) => onAction({ type: 'submit_response', value: text })}
            />
          );
        }
        return null;
      })}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {actions.map((action, index) => (
          <ActionButton
            key={`action-${index}`}
            label={action.label}
            type={action.type}
            onPress={() => onAction(action)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16
  }
});

export default renderTutorResponse;
