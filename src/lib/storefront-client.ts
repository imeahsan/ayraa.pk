let navigationPromise: Promise<any[]> | null = null;
let tickerPromise: Promise<string[]> | null = null;
let navigationCache: any[] | null = null;
let tickerCache: string[] | null = null;

export async function getClientNavigationCategories(): Promise<any[]> {
  if (navigationCache) return navigationCache;
  if (!navigationPromise) {
    navigationPromise = fetch("/api/storefront/navigation")
      .then((res) => {
        if (!res.ok) throw new Error("Navigation fetch failed");
        return res.json();
      })
      .then((data) => {
        navigationCache = data;
        return data;
      })
      .catch((err) => {
        navigationPromise = null;
        throw err;
      });
  }
  return navigationPromise;
}

export async function getClientTickerMessages(): Promise<string[]> {
  if (tickerCache) return tickerCache;
  if (!tickerPromise) {
    tickerPromise = fetch("/api/storefront/ticker")
      .then((res) => {
        if (!res.ok) throw new Error("Ticker fetch failed");
        return res.json();
      })
      .then((data) => {
        tickerCache = data;
        return data;
      })
      .catch((err) => {
        tickerPromise = null;
        throw err;
      });
  }
  return tickerPromise;
}
