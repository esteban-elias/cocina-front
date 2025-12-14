import '../../global.css';
import { useCallback, useContext, useMemo, useState } from 'react';
import { View, ScrollView, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { RefreshContext } from './refresh-context';
import { useDeviceId } from '../../hooks/use-device-id';

type Ingredient = {
  id: number;
  name: string;
  name_es?: string | null;
  img_url?: string | null;
};

type Product = {
  id: number;
  name: string;
  price?: number;
  url: string;
  ingredient_id?: number | null;
};

type Recipe = {
  id: number;
  name: string;
  name_es?: string | null;
  instructions?: string;
  instructions_es?: string | null;
  img_url?: string | null;
  video_url?: string | null;
  missing_ingredients: Ingredient[];
  matching_ingredients: Ingredient[];
  missing_products: Product[];
};


export default function Index() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [visibleCount, setVisibleCount] = useState(15);
  const router = useRouter();
  const { refreshRecipesKey } = useContext(RefreshContext);
  const {
    deviceId,
    isLoading: isDeviceIdLoading,
    error: deviceIdError,
  } = useDeviceId();
  const getIngredientName = useCallback(
    (ingredient: Ingredient) => (ingredient.name_es ?? '').trim() || ingredient.name,
    []
  );
  const getRecipeName = useCallback(
    (recipe: Recipe) => (recipe.name_es ?? '').trim() || recipe.name,
    []
  );
  const getRecipeInstructions = useCallback(
    (recipe: Recipe) => (recipe.instructions_es ?? '').trim() || recipe.instructions || '',
    []
  );

  useFocusEffect(
    useCallback(() => {
      if (!deviceId) return;
      let isCancelled = false;
      const loadRecipes = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/recipes/${deviceId}`);
          const data = await response.json();
          const recipesPayload: Recipe[] = Array.isArray(data?.recipes) ? data.recipes : [];
          const normalizedRecipes = recipesPayload.map((recipe) => ({
            ...recipe,
            missing_ingredients: Array.isArray(recipe.missing_ingredients) ? recipe.missing_ingredients : [],
            matching_ingredients: Array.isArray(recipe.matching_ingredients) ? recipe.matching_ingredients : [],
            missing_products: Array.isArray(recipe.missing_products) ? recipe.missing_products : [],
          }));

          // Show cookable recipes first, then sort not-cookable by ingredients count ascending,
          // then filter out not-cookable with no missing products
          const cookable = [...normalizedRecipes].filter(
            (recipe) => recipe.missing_ingredients.length === 0
          );
          const notCookable = [...normalizedRecipes].filter(
            (recipe) => recipe.missing_ingredients.length > 0
          );
          const notCookableSorted = notCookable.sort(
            (a, b) => a.missing_ingredients.length - b.missing_ingredients.length
          );
          const notCookableFiltered = notCookableSorted.filter(
            (recipe) => recipe.missing_products.length > 0
          );
          const merged = [...cookable, ...notCookableFiltered];
          if (!isCancelled) {
            setRecipes(merged);
            setVisibleCount(15);
          }
        } catch (err) {
          if (!isCancelled) {
            const message = err instanceof Error ? err : new Error('No se pudieron cargar las recetas');
            setError(message);
          }
        } finally {
          if (!isCancelled) {
            setIsLoading(false);
          }
        }
      };

      loadRecipes();
      return () => {
        isCancelled = true;
      };
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
          {visibleRecipes.map((recipe) => {
            const recipeName = getRecipeName(recipe);
            const instructions = getRecipeInstructions(recipe);
            const matchingIngredients = recipe.matching_ingredients ?? [];
            const missingIngredients = recipe.missing_ingredients ?? [];
            const missingProducts = recipe.missing_products ?? [];

            return (
              <Pressable
                key={recipe.id}
                onPress={() =>
                  router.push({
                    pathname: '/recipe/[id]',
                    params: {
                      id: String(recipe.id),
                      name: recipe.name,
                      name_es: recipe.name_es,
                      instructions_es: recipe.instructions_es,
                      instructions: recipe.instructions ?? '',
                      missingProducts: JSON.stringify(missingProducts),
                      video_url: recipe.video_url,
                    },
                  })
                }
              >
                <View className={`p-4 rounded-2xl ${missingIngredients.length === 0 ? 'bg-green-100' : 'bg-zinc-200'}`}>
                  <Text className='leading-6 text-lg font-semibold'>{recipeName}</Text>
                  {recipe.img_url ? (
                    <Image
                      source={{ uri: recipe.img_url }}
                      className='mt-3 w-full h-48 rounded-2xl border border-zinc-300'
                      resizeMode='cover'
                    />
                  ) : null}
                  {missingIngredients.length === 0 ? (
                    <View>
                      <Text className='mt-4 font-medium text-green-900'>¡Ya puedes cocinar esta receta!</Text>
                    </View>
                  ) : (
                    <View>
                      <View className='flex flex-row flex-wrap mt-4'>
                        <Text className='font-medium text-zinc-600'>Ya tienes </Text>
                        {matchingIngredients.map((ingredient, index) => (
                          <Text key={ingredient.id} className='font-medium text-green-900'>
                            {getIngredientName(ingredient)}{index === matchingIngredients.length - 1 ? '.' : ', '}
                          </Text>
                        ))}
                      </View>
                      <View className='flex flex-row flex-wrap'>
                        <Text className='font-medium text-zinc-600'>Te falta </Text>
                        {missingIngredients.map((ingredient, index) => (
                          <Text key={ingredient.id} className='font-medium text-red-900'>
                            {getIngredientName(ingredient)}{index === missingIngredients.length - 1 ? '.' : ', '}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}

                </View>
              </Pressable>
            );
          })}
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
