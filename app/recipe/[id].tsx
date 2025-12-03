import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

export default function RecipeDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const name = Array.isArray(params.name) ? params.name[0] : params.name;

  const instructionsParam = Array.isArray(params.instructions)
    ? params.instructions[0]
    : params.instructions;

  const instructions = instructionsParam || 'No hay instrucciones disponibles.';

  const missingProductsParam = Array.isArray(params.missingProducts)
    ? params.missingProducts[0]
    : params.missingProducts;

  const missingProducts = missingProductsParam ? JSON.parse(missingProductsParam) : [];

  return (
    <ScrollView className="flex-1 bg-zinc-400 px-4 pt-4 gap-4">
      <Text className="text-2xl font-semibold">{name}</Text>
      <View className="bg-white rounded-lg p-4">
        <Text className="text-base leading-6">{instructions}</Text>
      </View>
      <View className="bg-white rounded-lg p-4 gap-2">
        <Text className="text-lg font-semibold">Productos para ingredientes faltantes</Text>
        {missingProducts.length === 0 ? (
          <Text className="text-sm text-gray-600">No hay productos sugeridos.</Text>
        ) : (
          missingProducts.map((product: any) => (
            <Text key={product.id} className="text-blue-500">
              {product.name}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}
