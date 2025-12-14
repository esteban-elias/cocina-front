import { useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import '../../global.css';
import { RefreshContext, RefreshProvider } from './refresh-context';
import { useDeviceId } from '../../hooks/use-device-id';

const ONBOARDING_KEY = 'hasOnboarded';

type Ingredient = {
  id: number;
  name: string;
  name_es?: string | null;
  img_url?: string | null;
};

function BasicIngredientsModal() {
  const { triggerRefreshRecipes } = useContext(RefreshContext);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  const [suggestedIngredients, setSuggestedIngredients] = useState<Ingredient[]>([]);
  const {
    deviceId,
    isLoading: isDeviceIdLoading,
    error: deviceIdError,
  } = useDeviceId();
  const getIngredientName = useCallback(
    (ingredient: Ingredient) => (ingredient.name_es ?? '').trim() || ingredient.name,
    []
  );

  const fetchBasics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/ingredients/basics`);
      if (!response.ok) {
        throw new Error('Failed to load basic ingredients');
      }
      const data = await response.json();
      setSuggestedIngredients(data);
      setIsVisible(true);
    } catch (err) {
      const message = err instanceof Error ? err : new Error('Failed to load basic ingredients');
      Alert.alert('Could not load basics', message.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (value === 'true') {
          setIsLoading(false);
          setHasCheckedOnboarding(true);
          return;
        }
        await fetchBasics();
      } catch (err) {
        const message = err instanceof Error ? err : new Error('Failed to load basic ingredients');
        Alert.alert('Could not load basics', message.message);
      } finally {
        setHasCheckedOnboarding(true);
      }
    };

    checkOnboarding();
  }, [fetchBasics]);

  const removeIngredient = useCallback((ingredientId: number) => {
    setSuggestedIngredients((prev) => prev.filter((ingredient) => ingredient.id !== ingredientId));
  }, []);

  const confirmAdd = useCallback(async () => {
    if (suggestedIngredients.length === 0) {
      setIsVisible(false);
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      return;
    }

    if (!deviceId) {
      Alert.alert('Preparando', 'Estamos configurando tu dispositivo, intenta en unos segundos.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ingredientIds = suggestedIngredients.map((ingredient) => ingredient.id);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/ingredients/${deviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingredientIds),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const detail = body?.detail ?? 'Failed to add ingredients';
        throw new Error(detail);
      }

      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setIsVisible(false);
      triggerRefreshRecipes();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add ingredients';
      Alert.alert('Could not add basics', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [deviceId, suggestedIngredients]);

  if (!hasCheckedOnboarding || !isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {}}
    >
      <View className="flex-1 bg-white px-4 py-6">
        <View className="flex-1">
          <Text className="text-xl font-bold">Canasta básica</Text>
          <Text className="text-gray-600 mt-1">Elegimos algunos ingredientes para empezar.</Text>
          {deviceIdError ? (
            <Text className="text-red-500 mt-2">
              No pudimos preparar el dispositivo: {deviceIdError.message}
            </Text>
          ) : null}

          {isLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator />
            </View>
          ) : (
            <ScrollView className="mt-6 ">
              <View className="flex-row flex-wrap justify-center gap-x-6 gap-y-6">
                {suggestedIngredients.map((ingredient) => (
                  <View key={ingredient.id} className="relative max-w-28 gap-2">
                    <Pressable
                      onPress={() => removeIngredient(ingredient.id)}
                      className="absolute right-0 top-0 z-10 bg-zinc-100 rounded-full p-1.5"
                      hitSlop={12}
                    >
                      <MaterialIcons size={12} name="close" color='gray' />
                    </Pressable>
                    {ingredient.img_url ? (
                      <Image
                        source={{ uri: ingredient.img_url }}
                        className="size-28 rounded-2xl"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="size-28 rounded-2xl bg-zinc-300" />
                    )}
                    <Text className="text-center">{getIngredientName(ingredient)}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          <View className="mt-6 flex-row justify-end">
            <Pressable
              onPress={confirmAdd}
              disabled={isSubmitting || isLoading || isDeviceIdLoading || !deviceId}
              className={`px-5 py-3 rounded-full ${
                isSubmitting || isLoading || isDeviceIdLoading || !deviceId ? 'bg-gray-400' : 'bg-green-800'
              }`}
            >
              <Text className="text-green-100 font-bold">
                {isSubmitting ? 'Adding...' : `Confirmar (${suggestedIngredients.length})`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function TabLayout() {
  return (
    <RefreshProvider>
      <BasicIngredientsModal />
      <Tabs
        screenOptions={{
          tabBarInactiveTintColor: '#9ca3af',
          tabBarActiveTintColor: '#15803d',
        }}

      >
        <Tabs.Screen
          name='index'
          options={{
            title: 'Recetas',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="food-bank" color={color} />,
          }}
        />
        <Tabs.Screen
          name='add-ingredients'
          options={{
            title: 'Agregar Ingredientes',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="add-photo-alternate" color={color} />,
          }}
        />
        <Tabs.Screen
          name='ingredients'
          options={{
            title: 'Ingredientes',
            tabBarIcon: ({ color }) => <MaterialIcons size={28} name="shopping-basket" color={color} />,
          }}
        />
      </Tabs>
      <StatusBar style="auto" />
    </RefreshProvider>
  );
}
