import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View, Pressable, Linking } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { WebView } from 'react-native-webview';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useDeviceId } from '../../hooks/use-device-id';
import { formatPrice } from '../../lib/utils';

type MissingProduct = {
  id: number;
  name: string;
  url: string;
  price?: number;
  ingredient_id?: number | null;
};

type Ingredient = {
  id: number;
  name: string;
  name_es?: string | null;
};

export default function RecipeDetail() {
  const params = useLocalSearchParams();
  const {
    deviceId,
    isLoading: isDeviceIdLoading,
    error: deviceIdError,
  } = useDeviceId();

  const name = Array.isArray(params.name) ? params.name[0] : params.name;
  const nameEs = Array.isArray(params.name_es) ? params.name_es[0] : params.name_es;
  const displayName = nameEs || name || 'Receta';

  const instructionEsParam = Array.isArray(params.instructions_es)
    ? params.instructions_es[0]
    : params.instructions_es;
  const instructionsParam = Array.isArray(params.instructions)
    ? params.instructions[0]
    : params.instructions;

  const instructions = instructionEsParam || instructionsParam || 'No hay instrucciones disponibles.';

  const missingProductsParam = Array.isArray(params.missingProducts)
    ? params.missingProducts[0]
    : params.missingProducts;

  let missingProducts: MissingProduct[] = [];
  if (missingProductsParam) {
    try {
      missingProducts = JSON.parse(missingProductsParam) as MissingProduct[];
    } catch (error) {
      console.warn('Invalid missing products payload', error);
    }
  }
  const ingredientsParam = Array.isArray(params.ingredients) ? params.ingredients[0] : params.ingredients;
  let ingredients: Ingredient[] = [];
  if (ingredientsParam) {
    try {
      ingredients = JSON.parse(ingredientsParam) as Ingredient[];
    } catch (error) {
      console.warn('Invalid ingredients payload', error);
    }
  }
  const videoUrlParam = Array.isArray(params.video_url) ? params.video_url[0] : params.video_url;
  const videoId = videoUrlParam ? getYouTubeVideoId(videoUrlParam) : null;

  const handleProductPress = async (product: MissingProduct) => {
    try {
      if (!deviceId) {
        await Linking.openURL(product.url);
        return;
      }

      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/product-clicks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          product_id: product.id,
        }),
      });
    } catch (error) {
      console.warn('Failed to record product click', error);
    } finally {
      try {
        await Linking.openURL(product.url);
      } catch (linkError) {
        console.warn('Failed to open product URL', linkError);
      }
    }
  };

  if (isDeviceIdLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Cargando...</Text>
      </View>
    );
  }

  if (deviceIdError) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-red-500 text-center">
          No se pudo preparar tu dispositivo: {deviceIdError.message}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-4 pt-4">
      <Text className="mt-2 text-2xl font-semibold">{displayName}</Text>

      {videoId ? (
        <View className="mt-4 w-full h-60 rounded-xl overflow-hidden border border-zinc-200">
          <YoutubePlayer height={240} videoId={videoId} />
        </View>
      ) : videoUrlParam ? (
        <View className="mt-4 w-full h-60 rounded-xl overflow-hidden border border-zinc-200">
          <WebView source={{ uri: videoUrlParam }} allowsInlineMediaPlayback />
        </View>
      ) : null}

      <View className="mt-6 gap-2 rounded-2xl">
        <Text className="text-xl font-semibold">Ingredientes</Text>
        {ingredients.length === 0 ? (
          <Text className="text-base leading-6 text-zinc-500">Sin ingredientes disponibles.</Text>
        ) : (
          <Text className="text-base leading-6">
            {ingredients.map((ingredient, index) => {
              const name = ingredient.name_es?.trim() || ingredient.name;
              const isLast = index === ingredients.length - 1;
              return `${name}${isLast ? '.' : ', '}`;
            }).join('')}
          </Text>
        )}
      </View>

      <View className={`mt-6 gap-2 rounded-2xl ${missingProducts.length === 0 && 'pb-24'}`}>
        <Text className="text-xl font-semibold">Instrucciones</Text>
        <Text className="text-base leading-6">{instructions}</Text>
      </View>

      {missingProducts.length > 0 ? (
        <View className="mt-8 mb-20 px-4 pt-4 pb-10 rounded-2xl bg-green-600">
          <View className='flex-row'>
            <Text className="text-lg font-semibold text-white">JUMB</Text>
            <Text className="text-lg font-semibold text-yellow-500">OFERTAS</Text>
          </View>
          {missingProducts.map((product) => (
            <Pressable
              key={product.id}
              className="mt-4"
              onPress={() => handleProductPress(product)}
            >
              {({ pressed }) => (
                <View className="flex-row flex-wrap items-center">
                  <Text className={`font-medium ${pressed ? 'text-yellow-500' : 'text-white'}`}>
                    {product.name}
                  </Text>
                  <Text className={`font-medium ${pressed ? 'text-yellow-500' : 'text-white'}`}>
                    {' — '}
                  </Text>
                  <Text className={`font-medium ${pressed ? 'text-yellow-500' : 'text-white'}`}>
                    {formatPrice(product.price)}
                  </Text>
                  <MaterialIcons
                    size={14}
                    name="link"
                    color={pressed ? '#eab308' : 'white'}
                    className={`ml-1 -rotate-45 ${pressed ? 'text-yellow-500' : 'text-white'}`}
                  />
                </View>
              )}
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.slice(1) || null;
    }
    if (parsed.searchParams.get('v')) {
      return parsed.searchParams.get('v');
    }
    const pathParts = parsed.pathname.split('/');
    const embedIndex = pathParts.indexOf('embed');
    if (embedIndex !== -1 && pathParts[embedIndex + 1]) {
      return pathParts[embedIndex + 1];
    }
    return null;
  } catch {
    return null;
  }
}
