import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        let item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
    });
    useEffect(() => window.localStorage.setItem(key, JSON.stringify(storedValue)), [key, storedValue]);
    return [storedValue, setStoredValue] as const;
}
