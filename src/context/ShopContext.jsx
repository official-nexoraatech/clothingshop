import { useEffect, useState } from 'react';
import { useAuth } from './authState';
import { ShopContext } from './shopState';
export function ShopProvider({ children }) {
  const { request } = useAuth();
  const [settings, setSettings] = useState(null);
  useEffect(() => { let active = true; request('/shop-settings').then(data => { if (active) setSettings(data.settings); }).catch(() => {}); return () => { active = false; }; }, [request]);
  return <ShopContext.Provider value={{ settings, setSettings }}>{children}</ShopContext.Provider>;
}

