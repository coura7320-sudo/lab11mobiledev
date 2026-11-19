import { Image } from 'expo-image';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Message } from '@/types/message';

export function Bubble({
  message,
  mine = false,
}: {
  message: Message;
  mine?: boolean;
}) {
  const isMine = message.mine ?? mine;

  function renderContent() {
    switch (message.kind) {
      case 'text':
        return (
          <Text style={isMine ? styles.textMine : styles.text}>
            {message.text}
          </Text>
        );
      case 'photo':
        return (
          <Image
            source={{ uri: message.uri }}
            style={styles.photo}
            contentFit="cover"
          />
        );
      case 'location': {
        const label = message.approximate
          ? '📍 Location (approximate)'
          : '📍 Location';
        const url = `https://www.google.com/maps/search/?api=1&query=${message.latitude},${message.longitude}`;
        return (
          <Pressable
            onPress={() => Linking.openURL(url)}
            accessibilityRole="link"
            accessibilityLabel={`Open ${label} in Maps`}
          >
            <Text
              style={[
                isMine ? styles.textMine : styles.text,
                styles.locationText,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      }
    }
  }

  return (
    <View style={[styles.bubble, isMine && styles.bubbleMine]}>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 14,
    maxWidth: '75%',
    margin: 8,
    alignSelf: 'flex-start',
  },
  bubbleMine: {
    backgroundColor: '#1a5276',
    alignSelf: 'flex-end',
  },
  text: {
    color: '#000',
  },
  textMine: {
    color: '#fff',
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  locationText: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
