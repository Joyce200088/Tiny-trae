import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  // 使用 useState 来管理是否已挂载
  const [isClient, setIsClient] = useState(false);
  
  // 获取初始值
  const [storedValue, setStoredValue] = useState<T>(() => {
    // 在服务端渲染时总是返回初始值
    return initialValue;
  });

  // 在客户端挂载后从 localStorage 读取值
  useEffect(() => {
    setIsClient(true);
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  // 返回包装的版本，用于持久化新值到localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // 允许值是一个函数，这样我们就有了与useState相同的API
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // 保存到localStorage（仅在客户端）
      if (isClient) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

export default useLocalStorage;