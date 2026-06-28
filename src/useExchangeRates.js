import { useState, useEffect, useCallback } from 'react';

const API_URL = 'https://open.er-api.com/v6/latest/ZMW';
const CACHE_KEY = 'zmw-rates-cache';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour — matches the API's own daily update cadence

/**
 * Fetches live ZMW exchange rates, with in-memory caching to avoid
 * hammering the free API, and graceful fallback to last-known-good
 * data if a fetch fails (e.g. offline, API down).
 */
export function useExchangeRates() {
  const [rates, setRates] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | live | stale | error
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchRates = useCallback(async (isRetry = false) => {
    try {
      if (!isRetry) setStatus('loading');

      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`API responded with ${res.status}`);

      const data = await res.json();
      if (data.result !== 'success' || !data.rates) {
        throw new Error('Unexpected API response shape');
      }

      const payload = {
        rates: data.rates,
        fetchedAt: Date.now(),
        apiTimestamp: data.time_last_update_utc || null,
      };

      window.sessionStorage?.setItem(CACHE_KEY, JSON.stringify(payload));
      setRates(payload.rates);
      setLastUpdated(payload.apiTimestamp);
      setStatus('live');
      setErrorMessage(null);
    } catch (err) {
      // Fall back to cached data if we have it, mark as stale rather than dead
      try {
        const cached = window.sessionStorage?.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setRates(parsed.rates);
          setLastUpdated(parsed.apiTimestamp);
          setStatus('stale');
          setErrorMessage('Showing last saved rates — live update failed.');
          return;
        }
      } catch {
        // cache read also failed, fall through to hard error
      }
      setStatus('error');
      setErrorMessage(err.message || 'Could not load exchange rates.');
    }
  }, []);

  useEffect(() => {
    // Try cache first for instant paint, then revalidate
    try {
      const cached = window.sessionStorage?.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - parsed.fetchedAt;
        if (age < CACHE_TTL) {
          setRates(parsed.rates);
          setLastUpdated(parsed.apiTimestamp);
          setStatus('live');
        }
      }
    } catch {
      // ignore cache errors, proceed to fetch
    }
    fetchRates();
  }, [fetchRates]);

  return { rates, lastUpdated, status, errorMessage, refetch: () => fetchRates(true) };
}
