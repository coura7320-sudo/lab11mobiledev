import { useIsFocused } from '@react-navigation/native';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

const PREFIX = 'daust-contact:';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const router = useRouter();
  const scannedRef = useRef(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isFocused) {
      scannedRef.current = false;
      setErrorNotice(null);
    }
  }, [isFocused]);

  // State 1: permission object is still loading
  if (!permission) {
    return <View style={styles.centered} />;
  }

  // State 2: not granted, but we can still ask
  if (!permission.granted && permission.canAskAgain) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Scan a DAUST Contact QR Code</Text>
        <Text style={styles.body}>
          DAUST Messenger needs camera access to scan a classmate&apos;s QR code.
        </Text>
        <Pressable
          style={styles.button}
          onPress={requestPermission}
          accessibilityRole="button"
        >
          <Text style={styles.buttonLabel}>Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  // State 3: not granted, and the OS will no longer show the prompt
  if (!permission.granted && !permission.canAskAgain) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Camera Access Turned Off</Text>
        <Text style={styles.body}>
          Enable camera access in your device settings to scan a DAUST contact QR code.
        </Text>
        <Pressable
          style={styles.button}
          onPress={() => Linking.openSettings()}
          accessibilityRole="button"
        >
          <Text style={styles.buttonLabel}>Open Settings</Text>
        </Pressable>
      </View>
    );
  }

  function handleBarcodeScanned({ data }: BarcodeScanningResult) {
    if (scannedRef.current) return;
    scannedRef.current = true;

    if (!data.startsWith(PREFIX)) {
      setErrorNotice('This is not a DAUST Messenger code.');
      return;
    }

    const contactId = data.slice(PREFIX.length).trim();
    if (!contactId) {
      setErrorNotice('This is not a DAUST Messenger code.');
      return;
    }

    router.navigate({
      pathname: '/contacts/[id]',
      params: { id: contactId },
    });
  }

  // State 4: permission granted
  return (
    <View style={styles.screen}>
      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
      )}
      <View style={styles.overlay}>
        <Text style={styles.hint}>Point at a daust-contact:&lt;id&gt; QR code</Text>
        {errorNotice && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorNotice}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => {
                setErrorNotice(null);
                scannedRef.current = false;
              }}
              accessibilityRole="button"
            >
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a5276',
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1a5276',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    marginTop: 8,
  },
  buttonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  hint: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  errorText: {
    color: '#92400e',
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1a5276',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});
