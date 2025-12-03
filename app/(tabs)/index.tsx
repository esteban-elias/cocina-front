import '../../global.css';
import { useCallback, useState } from 'react';
import { View, ScrollView, Text, Button, Image, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';


export default function Index() {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetch(`${process.env.EXPO_PUBLIC_API_URL}/recipes/1`)
        .then(res => res.json())
        .then(data => {
          // Sort by matching ingredients count descending
          const sorted = [...data.recipes].sort(
            (a, b) => b.matching_ingredients.length - a.matching_ingredients.length
          );
          setRecipes(sorted);
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

  if (recipes.length === 0) {
    return (
      <Text>Escanea ingredientes primero</Text>
    )
  }

  return (
    <ScrollView className='px-4 pt-4 flex-1 gap-8 bg-zinc-400'>
      <View className='gap-2'>
        <Text className='text-2xl'>Recetas sugeridas 🍲</Text>
        <Text className=''>En base a tus ingredientes, te sugerimos:</Text>
        <View className='gap-4'>
          {recipes.map((recipe) => (
            <Pressable
              key={recipe.id}
              onPress={() =>
                router.push({
                  pathname: '/recipe/[id]',
                  params: {
                    id: String(recipe.id),
                    name: recipe.name,
                    instructions: recipe.instructions,
                    missingProducts: JSON.stringify(recipe.missing_products ?? []),
                  },
                })
              }
            >
              <View>
                <Text>{recipe.name}</Text>
                <View>
                  {recipe.matching_ingredients.map((ingredient) => (
                    <Text key={ingredient.id} className='text-green-500'>
                      {ingredient.name}
                    </Text>
                  ))}
                </View>
                <View>
                  {recipe.missing_ingredients.map((ingredient) => (
                    <Text key={ingredient.id} className='text-red-500'>
                      {ingredient.name}
                    </Text>
                  ))}
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
