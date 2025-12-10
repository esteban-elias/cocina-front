import '../../global.css';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useDeviceId } from '../../hooks/use-device-id';

type Ingredient = {
  id: number;
  name: string;
  img_url?: string | null;
};

export default function Ingredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isManualModalVisible, setIsManualModalVisible] = useState(false);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const {
    deviceId,
    isLoading: isDeviceIdLoading,
    error: deviceIdError,
  } = useDeviceId();

  const fetchIngredients = useCallback(async () => {
    if (!deviceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/ingredients/${deviceId}`);
      if (!response.ok) {
        throw new Error('Failed to load ingredients');
      }
      const data = await response.json();
      setIngredients(data);
    } catch (err) {
      const message = err instanceof Error ? err : new Error('Failed to load ingredients');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  const deleteIngredient = useCallback(async (ingredientId: number) => {
    if (!deviceId) return;
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/ingredients/${deviceId}/${ingredientId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const detail = body?.detail ?? 'Failed to delete ingredient';
        throw new Error(detail);
      }

      setIngredients((prevIngredients) =>
        prevIngredients.filter((ingredient) => ingredient.id !== ingredientId)
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete ingredient';
      Alert.alert('Deletion failed', message);
    }
  }, [deviceId]);

  const confirmDelete = useCallback(
    (ingredient: Ingredient) => {
      Alert.alert(
        'Eliminar ingrediente',
        `¿Eliminar ${ingredient.name} de tu lista?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteIngredient(ingredient.id) },
        ],
        { cancelable: true }
      );
    },
    [deleteIngredient]
  );

  const fetchAllIngredients = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/ingredients/all`);
      if (!response.ok) {
        throw new Error('Failed to load all ingredients');
      }
      const data = await response.json();
      setAllIngredients(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load all ingredients';
      Alert.alert('Carga fallida', message);
    }
  }, []);

  const openManualModal = useCallback(() => {
    setIsManualModalVisible(true);
    if (allIngredients.length === 0) {
      fetchAllIngredients();
    }
  }, [allIngredients.length, fetchAllIngredients]);

  const closeManualModal = useCallback(() => {
    setIsManualModalVisible(false);
    setSearchTerm('');
  }, []);

  const filteredIngredients = useMemo(() => {
    if (!searchTerm.trim()) return allIngredients;
    const lower = searchTerm.toLowerCase();
    return allIngredients.filter((ingredient) =>
      ingredient.name.toLowerCase().includes(lower)
    );
  }, [allIngredients, searchTerm]);

  const addIngredient = useCallback(
    async (ingredient: Ingredient) => {
      if (!deviceId) return;
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/ingredients/${deviceId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([ingredient.id]),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const detail = body?.detail ?? 'Failed to add ingredient';
          throw new Error(detail);
        }

        setIngredients((prev) => {
          const exists = prev.some((item) => item.id === ingredient.id);
          if (exists) return prev;
          return [...prev, ingredient];
        });
        closeManualModal();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add ingredient';
        Alert.alert('No se pudo agregar', message);
      }
    },
    [closeManualModal, deviceId]
  );

  const confirmManualAdd = useCallback(
    (ingredient: Ingredient) => {
      Alert.alert(
        'Agregar ingrediente',
        `¿Agregar ${ingredient.name} a tu lista?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar', onPress: () => addIngredient(ingredient) },
        ],
        { cancelable: true }
      );
    },
    [addIngredient]
  );

  useFocusEffect(
    useCallback(() => {
      fetchIngredients();
    }, [fetchIngredients])
  );

  if (deviceIdError) return <Text>Error: {deviceIdError.message}</Text>;
  if (isDeviceIdLoading || isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View className="flex-1">
      <ScrollView className="flex-1">
        <View className="mt-8 flex-row flex-wrap justify-center gap-x-6 gap-y-8">
          {ingredients.map((ingredient) => (
            <View key={ingredient.id} className="relative max-w-28 gap-2">
              <Pressable
                onPress={() => confirmDelete(ingredient)}
                className="absolute right-0 top-0 z-10 bg-white rounded-full p-1.5"
                hitSlop={12}
              >
                <MaterialIcons size={12} name="close" color='red' />
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
              <Text>{ingredient.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Pressable
        onPress={openManualModal}
        className="absolute bottom-8 right-6 rounded-full bg-black p-4 shadow-lg"
        hitSlop={12}
      >
        <MaterialIcons name="add" size={28} color="white" />
      </Pressable>

      <Modal
        visible={isManualModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeManualModal}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="max-h-[80%] rounded-t-3xl bg-white p-4">
            <View className="mb-4 flex-row items-center rounded-full border border-gray-300 px-3">
              <MaterialIcons name="search" size={20} color="gray" />
              <TextInput
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Buscar ingrediente"
                className="flex-1 px-2 py-2"
                autoFocus
              />
              <Pressable onPress={closeManualModal} hitSlop={12}>
                <MaterialIcons name="close" size={20} color="gray" />
              </Pressable>
            </View>

            <ScrollView className="max-h-96">
              {filteredIngredients.map((ingredient) => (
                <Pressable
                  key={ingredient.id}
                  onPress={() => confirmManualAdd(ingredient)}
                  className="py-3 border-b border-gray-100"
                >
                  <Text className="text-base">{ingredient.name}</Text>
                </Pressable>
              ))}
              {filteredIngredients.length === 0 ? (
                <Text className="py-4 text-center text-gray-500">Sin resultados</Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
