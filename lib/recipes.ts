type ApiRecipe = {
  id: number;
  name: string;
  name_es?: string | null;
  missing_ingredients: unknown[];
};

export type CookableRecipe = {
  id: number;
  name: string;
};

export async function fetchCookableRecipes(deviceId: string): Promise<CookableRecipe[]> {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/recipes/${deviceId}`);

  if (!response.ok) {
    throw new Error('Failed to load recipes');
  }

  const data = await response.json();
  const recipes: ApiRecipe[] = Array.isArray(data?.recipes) ? data.recipes : [];

  return recipes
    .filter((recipe) => Array.isArray(recipe.missing_ingredients) && recipe.missing_ingredients.length === 0)
    .map((recipe) => ({
      id: recipe.id,
      name: (recipe.name_es ?? '').trim() || recipe.name,
    }));
}

export function findNewCookableRecipes(
  previous: CookableRecipe[],
  next: CookableRecipe[]
): CookableRecipe[] {
  const previousIds = new Set(previous.map((recipe) => recipe.id));
  return next.filter((recipe) => !previousIds.has(recipe.id));
}
