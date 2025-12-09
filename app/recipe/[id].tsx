import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View, Pressable, Linking } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { WebView } from 'react-native-webview';

const USER_ID = 1; // TODO: Get from auth context

type MissingProduct = {
  id: number;
  name: string;
  url: string;
  price?: number;
  ingredient_id?: number | null;
};

export default function RecipeDetail() {
  const params = useLocalSearchParams();

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
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/product-clicks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: USER_ID,
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

  return (
    <ScrollView className="flex-1 px-4 pt-4 gap-4">
      <Text className="text-2xl font-semibold">{name}</Text>

      {videoId ? (
        <View className="w-full h-60 rounded-xl overflow-hidden">
          <YoutubePlayer height={240} videoId={videoId} />
        </View>
      ) : videoUrlParam ? (
        <View className="w-full h-60 rounded-xl overflow-hidden">
          <WebView source={{ uri: videoUrlParam }} allowsInlineMediaPlayback />
        </View>
      ) : null}

      <View className="mt-4 p-4 rounded-2xl bg-zinc-200">
        <Text className="text-base leading-6">{instructions}</Text>
      </View>

      <View className="mt-8 mb-20 p-4 rounded-2xl bg-white">
        <Text className="text-lg font-semibold">Productos para ingredientes faltantes</Text>
        {missingProducts.length === 0 ? (
          <Text className="text-sm text-gray-600">No hay productos sugeridos.</Text>
        ) : (
          missingProducts.map((product) => (
            <Pressable
              key={product.id}
              className="mt-4"
              onPress={() => handleProductPress(product)}
            >
              <Text className="text-blue-500">{product.name}</Text>
              <Text className="text-blue-500 underline">{product.url}</Text>
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
