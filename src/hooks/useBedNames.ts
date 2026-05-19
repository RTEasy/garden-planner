import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const DEFAULTS: Record<1 | 2 | 3, string> = {
  1: 'Vegetables & Herbs',
  2: 'Cucumbers & Alliums',
  3: 'Cut Flowers & Herbs',
};

export function useBedNames() {
  const { user } = useAuth();
  const storageKey = `garden-bed-names-${user?.id ?? 'anon'}`;

  const [names, setNames] = useState<Record<1 | 2 | 3, string>>(() => {
    try {
      const stored = localStorage.getItem(`garden-bed-names-${user?.id ?? 'anon'}`);
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS };
    } catch {
      return { ...DEFAULTS };
    }
  });

  // Re-read from storage when user changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      setNames(stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS });
    } catch {
      setNames({ ...DEFAULTS });
    }
  }, [storageKey]);

  const setBedName = (bed: 1 | 2 | 3, name: string) => {
    const trimmed = name.trim() || DEFAULTS[bed];
    setNames(prev => {
      const next = { ...prev, [bed]: trimmed };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  return { bedNames: names, setBedName };
}
