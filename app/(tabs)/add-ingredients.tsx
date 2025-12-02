import '../../global.css';
import { useRef, useState } from 'react';
import { View, Text, Image, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';

const USER_ID = 1; // TODO: Get from auth context

export default function AddIngredients() {
  const [scannedIngredients, setScannedIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    const photo = await cameraRef.current.takePictureAsync();
    if (!photo) return;
    
    setPhotoUri(photo.uri);
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);

      const apiResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/scan-ingredients`, {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      setScannedIngredients(data.ingredients || []);
    } catch (err) {
      setError(err);
      console.error("Scan error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmIngredients = async () => {
    if (scannedIngredients.length === 0) return;

    setIsSubmitting(true);
    try {
      const ingredientIds = scannedIngredients.map((ing) => ing.id);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/ingredients/${USER_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingredientIds),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      router.replace('/(tabs)/ingredients');
    } catch (err) {
      setError(err);
      console.error("Confirm error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCamera = () => {
    setPhotoUri(null);
    setScannedIngredients([]);
    setError(null);
  };

  if (!permission) {
    return <View className="flex-1" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-center pb-4">We need your permission to use the camera</Text>
        <TouchableOpacity onPress={requestPermission} className="px-6 py-3 bg-black rounded-full">
          <Text className="text-white font-bold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!photoUri) {
    return (
      <View className="flex-1 bg-black">
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
        <View className="absolute bottom-10 left-0 right-0 items-center">
          <TouchableOpacity onPress={takePicture} className="size-20 rounded-full bg-white border-4 border-gray-300" />
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-500">Scanning image...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500">Error: {error.message}</Text>
        <TouchableOpacity onPress={resetCamera} className="mt-4 px-6 py-3 bg-black rounded-full">
          <Text className="text-white font-bold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 gap-4 bg-white">
      <Image source={{ uri: photoUri }} className="h-80 w-full bg-zinc-300" resizeMode="cover" />
      
      <Text className="px-4 text-xl font-bold">Detected Ingredients:</Text>

      <ScrollView className="flex-1">
        <View className="px-4 flex-row flex-wrap gap-4 pb-20">
          {scannedIngredients.map((ingredient) => (
            <View key={ingredient.id} className="w-32 gap-2 mb-2">
              <View className="size-32 bg-zinc-200 rounded-lg items-center justify-center">
                <Text className="text-2xl">🥕</Text>
              </View>
              <Text className="font-medium text-center">{ingredient.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="absolute bottom-10 left-0 right-0 items-center flex-row justify-center gap-4">
        <TouchableOpacity onPress={resetCamera} className="px-6 py-3 rounded-full bg-gray-200">
          <Text className="font-bold">Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={confirmIngredients} 
          disabled={isSubmitting || scannedIngredients.length === 0}
          className={`px-6 py-3 rounded-full shadow-lg ${isSubmitting ? 'bg-gray-400' : 'bg-black'}`}
        >
          <Text className="text-white font-bold">
            {isSubmitting ? 'Adding...' : `Confirmar (${scannedIngredients.length}) ➡️`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

