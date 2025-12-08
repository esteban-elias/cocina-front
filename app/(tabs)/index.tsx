import '../../global.css';
import { useCallback, useContext, useMemo, useState } from 'react';
import { View, ScrollView, Text, Image, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { RefreshContext } from './refresh-context';


export default function Index() {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(15);
  const router = useRouter();
  const { refreshRecipesKey } = useContext(RefreshContext);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      setError(null);
      fetch(`${process.env.EXPO_PUBLIC_API_URL}/recipes/1`)
        .then(res => res.json())
        .then(data => {
          // Sort by missing ingredients count ascending
          const sorted = [...data.recipes].sort(
            (a, b) => a.missing_ingredients.length - b.missing_ingredients.length
          );
          setRecipes(sorted);
          setVisibleCount(15);
          setIsLoading(false);
        })
        .catch(err => {
          setError(err);
          setIsLoading(false);
        });
    }, [refreshRecipesKey])
  );

  const visibleRecipes = useMemo(
    () => recipes.slice(0, visibleCount),
    [recipes, visibleCount]
  );

  const canLoadMore = visibleCount < recipes.length;

  const handleLoadMore = () => {
    if (!canLoadMore) return;
    setVisibleCount((prev) => Math.min(prev + 15, recipes.length));
  };

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  if (recipes.length === 0) {
    return (
      <Text>Escanea ingredientes primero</Text>
    )
  }

  return (
    <ScrollView className='px-4 pt-4 flex-1 gap-8'>
      <View className='pb-10 gap-2'>
        <Text className='text-2xl font-bold'>Recetas sugeridas 🍲</Text>
        <Text className='text-xl text-zinc-600'>En base a tus ingredientes, te sugerimos:</Text>
        <View className='gap-8 mt-4'>
          {visibleRecipes.map((recipe) => (
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
                    video_url: recipe.video_url,
                  },
                })
              }
            >
              <View className='p-4 rounded-2xl bg-zinc-200'>
                <Text className='font-semibold'>{recipe.name}</Text>
                {recipe.img_url ? (
                  <Image
                    source={{ uri: recipe.img_url }}
                    className='mt-2 w-full h-48 rounded-2xl'
                    resizeMode='cover'
                  />
                ) : null}



                <View className='flex flex-row mt-2'>
                  <Text>Ya tienes </Text>
                  {recipe.matching_ingredients.map((ingredient) => (
                    <Text key={ingredient.id} className='text-green-800'>
                      {ingredient.name},{' '}
                    </Text>
                  ))}
                </View>
                <View className='flex flex-row flex-wrap'>
                  <Text>Te falta </Text>
                  {recipe.missing_ingredients.map((ingredient) => (
                    <Text key={ingredient.id} className='text-red-800'>
                      {ingredient.name},{' '}
                    </Text>
                  ))}
                </View>
              </View>
            </Pressable>
          ))}
          {canLoadMore ? (
            <Pressable
              onPress={handleLoadMore}
              className="self-center rounded-full bg-black px-5 py-3"
            >
              <Text className="text-white font-bold">Cargar más</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}
