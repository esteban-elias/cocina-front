import '../../global.css';
import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const USER_ID = 1; // TODO: Get from auth context

type Ingredient = {
  id: number;
  name: string;
  img_url?: string | null;
};

export default function Ingredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchIngredients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/ingredients/${USER_ID}`);
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
  }, []);

  const deleteIngredient = useCallback(async (ingredientId: number) => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/ingredients/${USER_ID}/${ingredientId}`,
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
  }, []);

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

  useFocusEffect(
    useCallback(() => {
      fetchIngredients();
    }, [fetchIngredients])
  );

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
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
  );
}
