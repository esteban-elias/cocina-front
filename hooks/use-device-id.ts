import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const STORAGE_KEY = 'device_id';
let deviceIdPromise: Promise<string> | null = null;

async function ensureDeviceId(): Promise<string> {
  if (!deviceIdPromise) {
    deviceIdPromise = (async () => {
      const existing = await AsyncStorage.getItem(STORAGE_KEY);
      if (existing) return existing;

      const generated = Crypto.randomUUID();
      await AsyncStorage.setItem(STORAGE_KEY, generated);
      return generated;
    })();
  }

  return deviceIdPromise;
}

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    ensureDeviceId()
      .then((id) => {
        if (isMounted) setDeviceId(id);
      })
      .catch((err) => {
        if (isMounted) {
          const message = err instanceof Error ? err : new Error('Failed to load device id');
          setError(message);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    deviceId,
    isLoading: !deviceId && !error,
    error,
  };
}
