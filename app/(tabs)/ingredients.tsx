import '../../global.css';
import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
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
      <View className="mt-8 flex-row flex-wrap justify-center gap-x-6 gap-y-8">
        {ingredients.map((ingredient) => (
          <View key={ingredient.id} className="max-w-28 gap-2">
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
  )
}
