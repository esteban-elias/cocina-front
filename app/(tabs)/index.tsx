import '../../global.css';
import { useCallback, useContext, useMemo, useState } from 'react';
import { View, ScrollView, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { RefreshContext } from './refresh-context';
import { useDeviceId } from '../../hooks/use-device-id';


export default function Index() {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(15);
  const router = useRouter();
  const { refreshRecipesKey } = useContext(RefreshContext);
  const {
    deviceId,
    isLoading: isDeviceIdLoading,
    error: deviceIdError,
  } = useDeviceId();

  useFocusEffect(
    useCallback(() => {
      if (!deviceId) return;
      setIsLoading(true);
      setError(null);
      fetch(`${process.env.EXPO_PUBLIC_API_URL}/recipes/${deviceId}`)
        .then(res => res.json())
        .then(data => {
          // Sort by missing ingredients count ascending
          const sorted = [...data.recipes].sort(
            (a, b) => a.missing_ingredients.length - b.missing_ingredients.length
          );
          // Filter to show only recipes with missing products
          const filtered = sorted.filter(
            (recipe) => recipe.missing_products.length > 0
          )
          setRecipes(filtered);
          setVisibleCount(15);
          setIsLoading(false);
        })
        .catch(err => {
          setError(err);
          setIsLoading(false);
        });
    }, [deviceId, refreshRecipesKey])
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

  if (deviceIdError) return <Text>Error: {deviceIdError.message}</Text>;
  if (isDeviceIdLoading || isLoading) return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" />
    </View>
  )
  if (error) return <Text>Error: {error.message}</Text>;

  if (recipes.length === 0) {
    return (
      <Text className='mx-4 mt-6 text-xl font-semibold text-zinc-500'>Agrega ingredientes para mostrar recetas</Text>
    )
  }

  return (
    <ScrollView className='px-4 pt-6 flex-1 gap-8'>
      <View className='pb-10 gap-2'>
        <Text className='text-2xl font-bold text-zinc-900'>Basado en tus ingredientes</Text>
        <View className='gap-6 mt-2'>
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
              <View className={`p-4 rounded-2xl ${recipe.missing_ingredients.length === 0 ? 'bg-green-100' : 'bg-zinc-200'}`}>
                <Text className='leading-6 text-lg font-semibold'>{recipe.name}</Text>
                {recipe.img_url ? (
                  <Image
                    source={{ uri: recipe.img_url }}
                    className='mt-3 w-full h-48 rounded-2xl border border-zinc-300'
                    resizeMode='cover'
                  />
                ) : null}
                {recipe.missing_ingredients.length === 0 ? (
                  <View>
                    <Text className='mt-4 font-medium text-green-900'>¡Ya puedes cocinar esta receta!</Text>
                  </View>
                ) : (
                  <View>
                    <View className='flex flex-row flex-wrap mt-4'>
                      <Text className='font-medium text-zinc-600'>Ya tienes </Text>
                      {recipe.matching_ingredients.map((ingredient, index) => (
                        <Text key={ingredient.id} className='font-medium text-green-900'>
                          {ingredient.name}{index === recipe.matching_ingredients.length - 1 ? '.' : ', '}
                        </Text>
                      ))}
                    </View>
                    <View className='flex flex-row flex-wrap'>
                      <Text className='font-medium text-zinc-600'>Te falta </Text>
                      {recipe.missing_ingredients.map((ingredient, index) => (
                        <Text key={ingredient.id} className='font-medium text-red-900'>
                          {ingredient.name}{index === recipe.missing_ingredients.length - 1 ? '.' : ', '}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}

              </View>
            </Pressable>
          ))}
          {canLoadMore ? (
            <Pressable
              onPress={handleLoadMore}
              className="self-center rounded-full bg-black px-5 py-3 bg-green-800"
            >
              <Text className="font-bold text-green-100">Cargar más</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}
