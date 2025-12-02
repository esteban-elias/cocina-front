import '../../global.css';
import { useCallback, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';

const USER_ID = 1; // TODO: Get from auth context

export default function Ingredients() {
  const [ingredients, setIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetch(`${process.env.EXPO_PUBLIC_API_URL}/ingredients/${USER_ID}`)
        .then(res => res.json())
        .then(data => {
          setIngredients(data);
          setIsLoading(false);
        })
        .catch(err => {
          setError(err);
          setIsLoading(false);
        });
    }, [])
  );

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <ScrollView className="flex-1">
      <View className="p-4 flex-row flex-wrap gap-x-4 gap-y-8">
        {ingredients.map((ingredient) => (
          <View key={ingredient.id} className="w-32 gap-2">
            <View className="size-32 bg-zinc-200" />
            <Text>{ingredient.name}</Text>
          </View>
        ))}
      </View>
    </ScrollView>  
  )
}

