import { File, Paths } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Bubble } from '@/components/Bubble';
import { Message } from '@/types/message';

const START_MESSAGES: Message[] = [
  { id: '1', kind: 'text', text: 'Hi!', mine: false },
  { id: '2', kind: 'text', text: 'Hello Awa!', mine: true },
  { id: '3', kind: 'text', text: 'Ready for the lab?', mine: false },
];

function getMessagesFile(): File {
  return new File(Paths.document, 'messages.json');
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(START_MESSAGES);
  const [draft, setDraft] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [canOpenSettings, setCanOpenSettings] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    async function loadSavedMessages() {
      try {
        const file = getMessagesFile();
        if (file.exists) {
          const raw = await file.text();
          const parsed = JSON.parse(raw) as Message[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch {
        // Fallback to START_MESSAGES if reading fails
      }
    }
    loadSavedMessages();
  }, []);

  function addMessage(newMessage: Message) {
    setMessages((current) => {
      const updated = [...current, newMessage];
      try {
        getMessagesFile().write(JSON.stringify(updated));
      } catch {
        // Ignore persistence errors in preview environments
      }
      return updated;
    });
  }

  async function pickPhoto() {
    setNotice(null);
    setCanOpenSettings(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (result.canceled) return;
    setPhotoUri(result.assets[0].uri);
  }

  async function takePhoto() {
    setNotice(null);
    setCanOpenSettings(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      if (!permission.canAskAgain) {
        setNotice(
          'Camera permission is turned off in system settings. Open Settings to allow camera access.'
        );
        setCanOpenSettings(true);
      } else {
        setNotice(
          'Camera access was refused. You can still send text, library photos, or your location.'
        );
      }
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (result.canceled) return;
    setPhotoUri(result.assets[0].uri);
  }

  async function keepPhoto(tempUri: string): Promise<string> {
    const cleanUri = tempUri.split('?')[0];
    const dotIndex = cleanUri.lastIndexOf('.');
    const ext = dotIndex !== -1 ? cleanUri.slice(dotIndex) : '.jpg';
    const source = new File(tempUri);
    const destination = new File(Paths.document, `photo-${Date.now()}${ext}`);
    source.copy(destination);
    return destination.uri;
  }

  async function sendPhoto() {
    if (!photoUri) return;
    const uri = await keepPhoto(photoUri);
    addMessage({
      id: String(Date.now()),
      kind: 'photo',
      uri,
      mine: true,
    });
    setPhotoUri(null);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function sendText() {
    const text = draft.trim();
    if (text === '') return;

    addMessage({
      id: String(Date.now()),
      kind: 'text',
      text,
      mine: true,
    });
    setDraft('');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleSend() {
    setNotice(null);
    setCanOpenSettings(false);
    if (photoUri) {
      await sendPhoto();
    } else {
      await sendText();
    }
  }

  async function shareLocation() {
    setNotice(null);
    setCanOpenSettings(false);
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      if (!permission.canAskAgain) {
        setNotice(
          'Location permission is turned off in system settings. Open Settings to share your position.'
        );
        setCanOpenSettings(true);
      } else {
        setNotice(
          'Location access was refused. You can still send text and photos.'
        );
      }
      return;
    }

    setLocating(true);
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const approximate =
        permission.android?.accuracy === 'coarse' ||
        permission.ios?.accuracy === 'reduced';

      addMessage({
        id: String(Date.now()),
        kind: 'location',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        approximate,
        mine: true,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setNotice(
        'Could not find your position… Please check that location services are turned on.'
      );
    } finally {
      setLocating(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Image source="https://i.pravatar.cc/100" style={styles.avatar} />
        <Text style={styles.name}>Awa Diop</Text>
      </View>

      {notice && (
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeText}>{notice}</Text>
          <View style={styles.noticeActions}>
            {canOpenSettings && (
              <Pressable
                style={styles.settingsButton}
                onPress={() => Linking.openSettings()}
                accessibilityRole="button"
                accessibilityLabel="Open Settings"
              >
                <Text style={styles.settingsButtonText}>Open Settings</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                setNotice(null);
                setCanOpenSettings(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Dismiss notice"
            >
              <Text style={styles.dismissText}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      )}

      <FlatList
        data={messages}
        keyExtractor={(message) => message.id}
        renderItem={({ item }) => <Bubble message={item} mine={item.mine} />}
        ListHeaderComponent={<Text style={styles.dateLabel}>Today</Text>}
        ListEmptyComponent={
          <Text style={styles.empty}>No messages yet. Say hello.</Text>
        }
        style={styles.messages}
        contentContainerStyle={styles.messageContent}
        keyboardShouldPersistTaps="handled"
      />

      {photoUri && (
        <View style={styles.previewBar}>
          <Image
            source={{ uri: photoUri }}
            style={styles.previewImage}
            contentFit="cover"
          />
          <Pressable
            style={styles.removeButton}
            onPress={() => setPhotoUri(null)}
            accessibilityRole="button"
            accessibilityLabel="Remove photo preview"
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.footer}>
        <Pressable
          style={styles.iconButton}
          onPress={pickPhoto}
          accessibilityRole="button"
          accessibilityLabel="Attach photo from library"
        >
          <Text style={styles.iconLabel}>📎</Text>
        </Pressable>

        <Pressable
          style={styles.iconButton}
          onPress={takePhoto}
          accessibilityRole="button"
          accessibilityLabel="Take a photo with camera"
        >
          <Text style={styles.iconLabel}>📷</Text>
        </Pressable>

        <Pressable
          style={[styles.iconButton, locating && styles.iconButtonDisabled]}
          onPress={shareLocation}
          disabled={locating}
          accessibilityRole="button"
          accessibilityLabel="Share current location"
        >
          {locating ? (
            <ActivityIndicator size="small" color="#1a5276" />
          ) : (
            <Text style={styles.iconLabel}>📍</Text>
          )}
        </Pressable>

        <TextInput
          style={styles.input}
          placeholder="Write a message…"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          accessibilityLabel="Write a message"
        />

        <Pressable
          style={styles.send}
          onPress={handleSend}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Text style={styles.sendLabel}>➤</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  name: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  noticeBanner: {
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  noticeText: {
    color: '#92400e',
    fontSize: 13,
  },
  noticeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsButton: {
    backgroundColor: '#1a5276',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '600',
  },
  messages: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  messageContent: {
    paddingVertical: 8,
  },
  previewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#f9fafb',
  },
  previewImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
  },
  removeButtonText: {
    color: '#b91c1c',
    fontWeight: '600',
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonDisabled: {
    opacity: 0.5,
  },
  iconLabel: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a5276',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendLabel: {
    color: '#fff',
    fontSize: 16,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 32,
  },
  dateLabel: {
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
    paddingBottom: 8,
  },
});
