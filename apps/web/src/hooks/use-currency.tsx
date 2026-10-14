'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { currencyForTimezone, isCurrency } from '@/lib/currency';
import type { Currency } from '@/types';
type CurrencyContext = {
  currency: Currency;
  setCurrency: (value: Currency) => void;
  source: string;
  ready: boolean;
};
const Context = createContext<CurrencyContext>({
  currency: 'USD',
  setCurrency: () => {},
  source: 'default',
  ready: false,
});
export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, update] = useState<Currency>('USD');
  const [source, setSource] = useState('default');
  const [ready, setReady] = useState(false);
  const manualChoice = useRef(false);
  useEffect(() => {
    let active = true;
    async function resolve() {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem('omniscale-currency');
      } catch {
        /* Storage can be unavailable in private contexts. */
      }
      if (isCurrency(saved)) {
        if (active) {
          update(saved);
          setSource('your preference');
          setReady(true);
        }
        return;
      }
      let suggested = currencyForTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      let reason = 'timezone suggestion';
      try {
        const response = await fetch('/api/locale');
        const data = await response.json();
        if (isCurrency(data.currency)) {
          suggested = data.currency;
          reason = 'region suggestion';
        }
      } catch {
        /* Timezone suggestion remains usable offline. */
      }
      if (active) {
        if (!manualChoice.current) {
          update(suggested);
          setSource(reason);
        }
        setReady(true);
      }
    }
    void resolve();
    return () => {
      active = false;
    };
  }, []);
  function setCurrency(value: Currency) {
    manualChoice.current = true;
    update(value);
    setSource('your preference');
    try {
      localStorage.setItem('omniscale-currency', value);
    } catch {
      /* Keep the selection for this session. */
    }
  }
  return (
    <Context.Provider value={{ currency, setCurrency, source, ready }}>{children}</Context.Provider>
  );
}
export const useCurrency = () => useContext(Context);
