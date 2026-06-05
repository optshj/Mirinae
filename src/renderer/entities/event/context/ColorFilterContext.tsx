import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'color-filter';

interface ColorFilterContextValue {
  filteredColors: Set<string>;
  toggleColor: (colorId: string) => void;
  clearFilter: () => void;
}

const ColorFilterContext = createContext<ColorFilterContextValue | null>(null);

export function ColorFilterProvider({ children }: { children: React.ReactNode }) {
  const [filteredColors, setFilteredColors] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    }
    return new Set<string>();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...filteredColors]));
  }, [filteredColors]);

  const toggleColor = (colorId: string) => {
    setFilteredColors((prev) => {
      const next = new Set(prev);
      if (next.has(colorId)) {
        next.delete(colorId);
      } else {
        next.add(colorId);
      }
      return next;
    });
  };

  const clearFilter = () => setFilteredColors(new Set());

  return <ColorFilterContext.Provider value={{ filteredColors, toggleColor, clearFilter }}>{children}</ColorFilterContext.Provider>;
}

export function useColorFilter() {
  const ctx = useContext(ColorFilterContext);
  if (!ctx) throw new Error('useColorFilter must be used within ColorFilterProvider');
  return ctx;
}
