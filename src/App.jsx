import { useState, useMemo, useEffect, useRef } from 'react';
import { useExchangeRates } from './useExchangeRates';
import { useTheme } from './useTheme';
import { useDebouncedValue } from './useDebouncedValue';
import { FEATURED_CODES, currencyLabel, currencySymbol } from './currencyMeta';
import './App.css';

function formatNumber(value, maxDecimals = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(value);
}

function formatTimestamp(isoLike) {
  if (!isoLike) return null;
  try {
    const d = new Date(isoLike);
    return d.toLocaleString('en-ZM', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoLike;
  }
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={!isDark}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-icon sun" aria-hidden="true">☀</span>
        <span className="theme-toggle-icon moon" aria-hidden="true">☾</span>
        <span className={`theme-toggle-thumb ${isDark ? 'pos-dark' : 'pos-light'}`} aria-hidden="true" />
      </span>
    </button>
  );
}

function TickerStrip({ rates, status }) {
  return (
    <div className="ticker" role="region" aria-label="ZMW quick rates">
      <div className="ticker-track">
        {FEATURED_CODES.map((code) => {
          const rate = rates?.[code];
          // rates are ZMW-based: 1 ZMW = rate[code] units of `code`
          const perUnit = rate ? 1 / rate : null; // how many ZMW per 1 unit of foreign currency
          return (
            <div className="ticker-item" key={code}>
              <span className="ticker-code">ZMW/{code}</span>
              <span className="ticker-value">
                {perUnit ? formatNumber(perUnit, 2) : status === 'loading' ? '···' : '—'}
              </span>
              <span className="ticker-sub">per {currencySymbol(code)}1</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBanner({ status, errorMessage, lastUpdated, onRetry }) {
  if (status === 'live') {
    return (
      <div className="status-line status-live">
        <span className="status-dot" aria-hidden="true" />
        Live rates · last updated {formatTimestamp(lastUpdated) || 'recently'}
      </div>
    );
  }
  if (status === 'stale') {
    return (
      <div className="status-line status-stale">
        <span className="status-dot" aria-hidden="true" />
        {errorMessage} ({formatTimestamp(lastUpdated) || 'unknown time'})
        <button className="retry-btn" onClick={onRetry}>Retry</button>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="status-line status-error">
        <span className="status-dot" aria-hidden="true" />
        Rates unavailable — {errorMessage}
        <button className="retry-btn" onClick={onRetry}>Retry</button>
      </div>
    );
  }
  return (
    <div className="status-line status-loading">
      <span className="status-dot" aria-hidden="true" />
      Fetching live rates…
    </div>
  );
}

function Converter({ rates, status }) {
  const [zmwAmount, setZmwAmount] = useState('100');
  const [targetCode, setTargetCode] = useState('USD');
  const [direction, setDirection] = useState('toForeign'); // toForeign | toZMW
  const [inputError, setInputError] = useState(null);
  const [flash, setFlash] = useState(false);
  const debouncedAmount = useDebouncedValue(zmwAmount, 150);
  const prevResultRef = useRef(null);

  const allCodes = useMemo(() => {
    if (!rates) return FEATURED_CODES;
    return Object.keys(rates)
      .filter((c) => c !== 'ZMW')
      .sort((a, b) => {
        const aFeatured = FEATURED_CODES.includes(a);
        const bFeatured = FEATURED_CODES.includes(b);
        if (aFeatured && !bFeatured) return -1;
        if (!aFeatured && bFeatured) return 1;
        return a.localeCompare(b);
      });
  }, [rates]);

  const result = useMemo(() => {
    const amount = parseFloat(debouncedAmount);
    if (!rates || !targetCode || Number.isNaN(amount)) return null;
    const rate = rates[targetCode];
    if (!rate) return null;

    if (direction === 'toForeign') {
      return amount * rate; // ZMW -> foreign
    }
    return amount / rate; // amount is actually in foreign currency -> ZMW
  }, [rates, debouncedAmount, targetCode, direction]);

  // Brief visual acknowledgment when the result actually changes,
  // so the system visibly confirms the update (Nielsen: visibility of system status).
  useEffect(() => {
    if (result !== null && prevResultRef.current !== null && result !== prevResultRef.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 380);
      prevResultRef.current = result;
      return () => clearTimeout(t);
    }
    prevResultRef.current = result;
  }, [result]);

  function handleAmountChange(e) {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setZmwAmount(value);
      setInputError(null);
    } else {
      setInputError('Numbers only, please.');
    }
  }

  function handleSwap() {
    setDirection((d) => (d === 'toForeign' ? 'toZMW' : 'toForeign'));
    if (result !== null) {
      setZmwAmount(result.toFixed(2));
    }
  }

  const inputLabel = direction === 'toForeign' ? 'ZMW' : targetCode;
  const outputLabel = direction === 'toForeign' ? targetCode : 'ZMW';
  const outputSymbol = direction === 'toForeign' ? currencySymbol(targetCode) : 'K';

  return (
    <div className="converter-card">
      <div className="converter-row">
        <div className="field">
          <label htmlFor="amount-input">Amount ({inputLabel})</label>
          <input
            id="amount-input"
            type="text"
            inputMode="decimal"
            value={zmwAmount}
            onChange={handleAmountChange}
            placeholder="0.00"
            aria-invalid={inputError ? 'true' : 'false'}
            aria-describedby={inputError ? 'amount-error' : undefined}
          />
          {inputError && (
            <span className="field-error" id="amount-error" role="alert">{inputError}</span>
          )}
        </div>

        <button
          className="swap-btn"
          onClick={handleSwap}
          aria-label="Swap conversion direction"
          title="Swap direction"
        >
          ⇄
        </button>

        <div className="field">
          <label htmlFor="currency-select">Convert to</label>
          <select
            id="currency-select"
            value={targetCode}
            onChange={(e) => setTargetCode(e.target.value)}
          >
            {allCodes.map((code) => (
              <option key={code} value={code}>{currencyLabel(code)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="result-row" aria-live="polite">
        <span className="result-label">{outputLabel} value</span>
        <span className={`result-value ${flash ? 'flash' : ''}`}>
          {status === 'loading' && !rates ? (
            <span className="result-skeleton" aria-hidden="true" />
          ) : result !== null ? (
            <>{outputSymbol} {formatNumber(result, 2)}</>
          ) : (
            '—'
          )}
        </span>
      </div>

      {rates && targetCode && rates[targetCode] && (
        <div className="rate-footnote">
          1 ZMW = {formatNumber(rates[targetCode], 6)} {targetCode} · 1 {targetCode} = K{formatNumber(1 / rates[targetCode], 2)}
        </div>
      )}
    </div>
  );
}

function App() {
  const { rates, lastUpdated, status, errorMessage, refetch } = useExchangeRates();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-shell">
      <div className="bg-grid" aria-hidden="true" />

      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">K</span>
          <div className="brand-text">
            <span className="brand-name">kwacha<span className="dim">.</span>rates</span>
            <span className="brand-tag">Live ZMW exchange tracker</span>
          </div>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <main className="wrap">
        <TickerStrip rates={rates} status={status} />

        <section className="hero-copy">
          <h1>What's your Kwacha worth right now?</h1>
          <p>
            Live ZMW exchange rates against 160+ world currencies — built for
            checking the rate the way Zambians actually check it: fast, daily, no clutter.
          </p>
        </section>

        <StatusBanner
          status={status}
          errorMessage={errorMessage}
          lastUpdated={lastUpdated}
          onRetry={refetch}
        />

        <Converter rates={rates} status={status} />

        <footer className="app-footer">
          <p>
            Rates from a public daily-updated source. For informational use only —
            not financial advice, and not suitable for time-sensitive trades.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
