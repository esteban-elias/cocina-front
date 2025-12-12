import '../../global.css';
import { useRef, useState } from 'react';
import { View, Text, Image, ActivityIndicator, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { fetchCookableRecipes, findNewCookableRecipes } from '../../lib/recipes';
import { useDeviceId } from '../../hooks/use-device-id';

export default function AddIngredients() {
  const [scannedIngredients, setScannedIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const {
    deviceId,
    isLoading: isDeviceIdLoading,
    error: deviceIdError,
  } = useDeviceId();

  if (isDeviceIdLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-500">Preparando tu dispositivo...</Text>
      </View>
    );
  }

  if (deviceIdError) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500 text-center">
          Error al iniciar el dispositivo: {deviceIdError.message}
        </Text>
      </View>
    );
  }

  const loadCookableRecipes = async () => {
    if (!deviceId) return null;
    try {
      return await fetchCookableRecipes(deviceId);
    } catch (err) {
      console.error('Cookable fetch failed:', err);
      return null;
    }
  };

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
    if (scannedIngredients.length === 0 || !deviceId) return;

    setIsSubmitting(true);
    const previousCookable = await loadCookableRecipes();
    try {
      const ingredientIds = scannedIngredients.map((ing) => ing.id);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/ingredients/${deviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingredientIds),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedCookable = await loadCookableRecipes();
      if (previousCookable && updatedCookable) {
        const newCookable = findNewCookableRecipes(previousCookable, updatedCookable);
        if (newCookable.length > 0) {
          const recipeNames = newCookable.map((recipe) => recipe.name).join(', ');
          Toast.show({
            type: 'success',
            text1: `¡Ahora puedes cocinar ${recipeNames}!`,
          });
        }
      }

      // Reset to camera view after successful add
      setPhotoUri(null);
      setScannedIngredients([]);
      setError(null);
      router.replace('/');
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

  const removeScannedIngredient = (ingredientId: number) => {
    setScannedIngredients((prev) =>
      prev.filter((ingredient: { id: number }) => ingredient.id !== ingredientId)
    );
  };

  if (!permission) {
    return <View className="flex-1" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-center pb-4">Necesitamos permisos para usar la cámara</Text>
        <TouchableOpacity onPress={requestPermission} className="px-6 py-3 bg-black rounded-full">
          <Text className="text-white font-bold">Otorgar permisos</Text>
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
        <Text className="mt-4 text-gray-500">Escaneando imagen...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500">Error: {error.message}</Text>
        <TouchableOpacity onPress={resetCamera} className="mt-4 px-6 py-3 bg-black rounded-full">
          <Text className="text-white font-bold">Intentar de nuevo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 gap-4 bg-white">
      <Image source={{ uri: photoUri }} className="h-80 w-full bg-zinc-300" resizeMode="cover" />
      
      <Text className="px-4 text-xl font-bold">Ingredientes detectados:</Text>

      <ScrollView className="flex-1">
        <View className="flex-row flex-wrap justify-center gap-x-6 gap-y-8 pb-32">
          {scannedIngredients.map((ingredient) => (
            <View key={ingredient.id} className="relative max-w-28 gap-2">
              <Pressable
                onPress={() => removeScannedIngredient(ingredient.id)}
                className="absolute right-0 top-0 z-10 bg-zinc-100 rounded-full p-1.5"
                hitSlop={12}
              >
                <MaterialIcons size={12} name="close" color='gray' />
              </Pressable>
              {ingredient.img_url ? (
                <Image
                  source={{ uri: ingredient.img_url }}
                  className="size-28 rounded-lg"
                  resizeMode="cover"
                />
              ) : (
                <View className="size-32 bg-zinc-200 rounded-lg items-center justify-center">
                  <Text className="text-2xl">🥕</Text>
                </View>
              )}
              <Text className="font-medium text-center">{ingredient.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="absolute bottom-10 left-0 right-0 items-center flex-row justify-center gap-4">
        <TouchableOpacity onPress={resetCamera} className="px-6 py-3 rounded-full bg-gray-200">
          <Text className="font-bold">Retomar foto</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={confirmIngredients} 
          disabled={isSubmitting || !deviceId || scannedIngredients.length === 0}
          className={`px-6 py-3 rounded-full shadow-lg ${
            isSubmitting || !deviceId ? 'bg-gray-400' : 'bg-green-800'
          }`}
        >
          <Text className="text-green-100 font-bold">
            {isSubmitting ? 'Agregando...' : `Confirmar (${scannedIngredients.length})`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
