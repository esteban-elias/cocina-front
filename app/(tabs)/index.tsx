import '../../global.css';
import { useEffect, useState } from 'react';
import { View, Text, Button, Image } from 'react-native';


export default function Index() {
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL}/recipes/1`)
      .then(res => res.json())
      .then(data => {
        setRecipes(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  const products = recipes.almost_cookable_recipes
    ?.flatMap(recipe =>
      recipe.missing_ingredients?.flatMap(ingredient =>
        ingredient.products || []
      ) || []
    ) || [];

  return (
    <View className='px-4 pt-4 flex-1 gap-8 bg-zinc-400'>

      {/* Cookable section */}
      <View className='gap-2'>
        <Text className='text-2xl'>Listos para cocinar! 🍲</Text>
        <Text className=''>Con tus ingredientes, ya puedes cocinar</Text>
        <View className='flex-row gap-4'>

        {recipes.cookable_recipes.map((recipe) => (
          <View key={recipe.id} className=''>
            <View className='size-32 border'></View>
            <Text>{recipe.name}</Text>
          </View>
        ))}

        </View>
      </View>
      {/* Almost cookable section */}
      <View className='gap-2'>
        <Text className='text-2xl'>Compra y cocina... 🥣</Text>
        <Text className=''>Solo te falta 1 ingrediente para cocinar:</Text>
        <View className='flex-row gap-4'>

        {recipes.almost_cookable_recipes.map((recipe) => (
          <View key={recipe.id} className='w-32'>
            <View className='size-32 border'></View>
            <Text>{recipe.name}</Text>
            <Text className='truncate'>Te falta {recipe.missing_ingredients?.[0]?.name}</Text>
          </View>
        ))}
        </View>
      </View>

      {/* Products section */}
      <View className='p-4 rounded-2xl bg-zinc-500'>
        <View className='flex-row gap-4'>
          <Text>Jumbo ofertas</Text>
          <Text>Compra lo que te falta</Text>
        </View>
        <View>
          {products.map(product => (
            <Text className='text-zinc-200'>{product.name}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

