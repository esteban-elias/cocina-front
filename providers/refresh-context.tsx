import { createContext, PropsWithChildren, useCallback, useMemo, useState } from 'react';

type RefreshContextValue = {
  refreshRecipesKey: number;
  triggerRefreshRecipes: () => void;
};

export const RefreshContext = createContext<RefreshContextValue>({
  refreshRecipesKey: 0,
  triggerRefreshRecipes: () => {},
});

export function RefreshProvider({ children }: PropsWithChildren) {
  const [refreshRecipesKey, setRefreshRecipesKey] = useState(0);

  const triggerRefreshRecipes = useCallback(() => {
    setRefreshRecipesKey((prev) => prev + 1);
  }, []);

  const value = useMemo(
    () => ({ refreshRecipesKey, triggerRefreshRecipes }),
    [refreshRecipesKey, triggerRefreshRecipes]
  );

  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>;
}
