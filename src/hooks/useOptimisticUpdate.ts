import { useState, useCallback, useRef } from 'react';

export interface UseOptimisticUpdateOptions<T> {
  initialData: T;
  onUpdate: (data: T) => Promise<T>;
  onError?: (error: unknown, previousData: T) => void;
  rollbackOnError?: boolean;
}

export interface UseOptimisticUpdateResult<T> {
  data: T;
  isUpdating: boolean;
  error: unknown | null;
  update: (optimisticData: T | ((prev: T) => T)) => Promise<void>;
  reset: () => void;
}

export function useOptimisticUpdate<T>({
  initialData,
  onUpdate,
  onError,
  rollbackOnError = true,
}: UseOptimisticUpdateOptions<T>): UseOptimisticUpdateResult<T> {
  const [data, setData] = useState<T>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const previousDataRef = useRef<T>(initialData);

  const update = useCallback(
    async (optimisticData: T | ((prev: T) => T)) => {
      const newData =
        typeof optimisticData === 'function'
          ? (optimisticData as (prev: T) => T)(data)
          : optimisticData;

      previousDataRef.current = data;
      setData(newData);
      setIsUpdating(true);
      setError(null);

      try {
        const result = await onUpdate(newData);
        setData(result);
      } catch (err) {
        setError(err);
        if (rollbackOnError) {
          setData(previousDataRef.current);
        }
        onError?.(err, previousDataRef.current);
      } finally {
        setIsUpdating(false);
      }
    },
    [data, onUpdate, onError, rollbackOnError]
  );

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setIsUpdating(false);
  }, [initialData]);

  return {
    data,
    isUpdating,
    error,
    update,
    reset,
  };
}

export interface UseOptimisticListOptions<T extends { id: string }> {
  initialItems: T[];
  onAdd?: (item: T) => Promise<T>;
  onRemove?: (id: string) => Promise<void>;
  onUpdate?: (id: string, updates: Partial<T>) => Promise<T>;
  onError?: (error: unknown, action: string) => void;
}

export interface UseOptimisticListResult<T extends { id: string }> {
  items: T[];
  isLoading: boolean;
  error: unknown | null;
  addItem: (item: T) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<T>) => Promise<void>;
}

export function useOptimisticList<T extends { id: string }>({
  initialItems,
  onAdd,
  onRemove,
  onUpdate,
  onError,
}: UseOptimisticListOptions<T>): UseOptimisticListResult<T> {
  const [items, setItems] = useState<T[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const addItem = useCallback(
    async (item: T) => {
      const previousItems = items;
      setItems(prev => [...prev, item]);
      setIsLoading(true);
      setError(null);

      try {
        if (onAdd) {
          const result = await onAdd(item);
          setItems(prev => prev.map(i => (i.id === item.id ? result : i)));
        }
      } catch (err) {
        setItems(previousItems);
        setError(err);
        onError?.(err, 'add');
      } finally {
        setIsLoading(false);
      }
    },
    [items, onAdd, onError]
  );

  const removeItem = useCallback(
    async (id: string) => {
      const previousItems = items;
      setItems(prev => prev.filter(i => i.id !== id));
      setIsLoading(true);
      setError(null);

      try {
        await onRemove?.(id);
      } catch (err) {
        setItems(previousItems);
        setError(err);
        onError?.(err, 'remove');
      } finally {
        setIsLoading(false);
      }
    },
    [items, onRemove, onError]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<T>) => {
      const previousItems = items;
      setItems(prev =>
        prev.map(i => (i.id === id ? { ...i, ...updates } : i))
      );
      setIsLoading(true);
      setError(null);

      try {
        if (onUpdate) {
          const result = await onUpdate(id, updates);
          setItems(prev => prev.map(i => (i.id === id ? result : i)));
        }
      } catch (err) {
        setItems(previousItems);
        setError(err);
        onError?.(err, 'update');
      } finally {
        setIsLoading(false);
      }
    },
    [items, onUpdate, onError]
  );

  return {
    items,
    isLoading,
    error,
    addItem,
    removeItem,
    updateItem,
  };
}

export default useOptimisticUpdate;
