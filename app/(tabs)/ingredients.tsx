import '../../global.css';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

export default function Ingredients() {
  const [ingredients, setIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/ingredients/1')
      .then(res => res.json())
      .then(data => {
        setIngredients(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View className='p-4 flex-row flex-wrap gap-x-4 gap-y-8'>
      {ingredients.map((ingredient) => (
        <View className='w-32 gap-2'>
          <View className='size-32 bg-zinc-200'></View>
          <Text>{ingredient.name}</Text>
        </View>
      ))}
    </View>
  )
}

