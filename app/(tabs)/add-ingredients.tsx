import '../../global.css';
import { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, ScrollView } from 'react-native';

export default function addIngredients() {
  const [scannedIngredients, setScannedIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const imgUrl = 'https://assets.bonappetit.com/photos/57f7c8c4be4b67a12eecd7c9/master/w_4807,h_3434,c_limit/pantry-basic-ba-grid.jpg'

  useEffect(() => {
    const scanImg = async () => {
      try {
        // If using Android Emulator, use 'http://10.0.2.2:8000/scan-ingredients'
        const response = await fetch('http://localhost:8000/scan-ingredients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_url: imgUrl,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Extract the 'ingredients' array from the response object
        setScannedIngredients(data.ingredients || []);
      } catch (err) {
        setError(err);
        console.error("Scan error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    scanImg();
  }, []);

  if (isLoading) return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" />
      <Text className="mt-4 text-gray-500">Scanning image...</Text>
    </View>
  );

  if (error) return (
    <View className="flex-1 justify-center items-center p-4">
      <Text className="text-red-500">Error: {error.message}</Text>
    </View>
  );

  return (
    <View className='flex-1 gap-4 bg-white'>
      {/* Display the image being scanned */}
      <Image 
        source={{ uri: imgUrl }} 
        className='h-80 w-full bg-zinc-300'
        resizeMode="cover"
      />
      
      <Text className="px-4 text-xl font-bold">Detected Ingredients:</Text>

      <ScrollView className='flex-1'>
        {/* Added flex-wrap so ingredients flow to the next line */}
        <View className='px-4 flex-row flex-wrap gap-4 pb-20'>
          {scannedIngredients.map((ingredient) => (
            <View key={ingredient.id} className='w-32 gap-2 mb-2'>
              <View className='size-32 bg-zinc-200 rounded-lg items-center justify-center'>
                 {/* Placeholder for ingredient icon */}
                 <Text className="text-2xl">🥕</Text>
              </View>
              <Text className="font-medium text-center">{ingredient.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Confirm Button */}
      <View className='absolute bottom-10 left-0 right-0 items-center'>
        <View className='px-6 py-3 rounded-full bg-black shadow-lg'>
          <Text className="text-white font-bold">Confirmar ({scannedIngredients.length}) ➡️</Text>
        </View>
      </View>
    </View>
  )
}

