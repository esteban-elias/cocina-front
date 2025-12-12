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

export default function RecipeDetail() {
  const params = useLocalSearchParams();
  const {
    deviceId,
    isLoading: isDeviceIdLoading,
    error: deviceIdError,
  } = useDeviceId();

  const name = Array.isArray(params.name) ? params.name[0] : params.name;

  const instructionsParam = Array.isArray(params.instructions)
    ? params.instructions[0]
    : params.instructions;

  const instructions = instructionsParam || 'No hay instrucciones disponibles.';

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
      <Text className="mt-2 text-2xl font-semibold">{name}</Text>

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
        <Text className="text-xl font-semibold">Instrucciones</Text>
        <Text className="text-base leading-6">{instructions}</Text>
      </View>

      <View className="mt-8 mb-20 px-4 pt-4 pb-10 rounded-2xl bg-green-600">
        <View className='flex-row'>
          <Text className="text-lg font-semibold text-white">JUMB</Text>
          <Text className="text-lg font-semibold text-yellow-500">OFERTAS</Text>
        </View>
        {missingProducts.length === 0 ? (
          <Text className="text-sm text-white">No hay productos sugeridos.</Text>
        ) : (
          missingProducts.map((product) => (
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
          ))
        )}
      </View>
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
