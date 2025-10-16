import { useRef, useCallback } from 'react';

function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

export default useDebounce;