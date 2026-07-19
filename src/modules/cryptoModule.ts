import { useEffect, useRef } from "react";
import { composeIconTextBoard } from "../engine/iconTextLayout";
import { jammedErrorBoard } from "../engine/errorState";
import { COIN_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT } from "./appIcons";

interface Params {
  active: boolean;
  coinIds: string;
  vsCurrency: string;
  onUpdate: (raw: string[]) => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  usd: "$",
  eur: "EUR",
  gbp: "GBP",
  inr: "RS",
  jpy: "JPY",
};

function formatPrice(value: number): string {
  if (value >= 1000) return Math.round(value).toLocaleString("en-US");
  if (value >= 1) return value.toFixed(2);
  return value.toPrecision(3);
}

/**
 * CoinGecko's /simple/price endpoint needs no API key for reasonable
 * personal-use call volumes (confirmed public, rate-limited but not
 * gated). Shows up to 3 coins — more than that doesn't fit the content
 * area alongside the icon.
 */
export function useCryptoModule({ active, coinIds, vsCurrency, onUpdate }: Params) {
  const cache = useRef<{ key: string; raw: string[] } | null>(null);

  useEffect(() => {
    if (!active) return;
    const ids = coinIds
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 3);
    const currency = (vsCurrency.trim() || "usd").toLowerCase();

    if (ids.length === 0) {
      onUpdate(
        composeIconTextBoard(["CRYPTO", "SET COINS", "IN SETTINGS"], COIN_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT)
      );
      return;
    }

    const cacheKey = `${ids.join(",")}:${currency}`;
    if (cache.current && cache.current.key === cacheKey) {
      onUpdate(cache.current.raw);
      return;
    }

    let cancelled = false;
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
      ids.join(",")
    )}&vs_currencies=${encodeURIComponent(currency)}`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("request failed");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const symbol = CURRENCY_SYMBOLS[currency] ?? currency.toUpperCase();
        const lines = ids
          .map((id) => {
            const price = data?.[id]?.[currency];
            if (price == null) return null;
            const name = id.length > 12 ? id.slice(0, 12) : id;
            return `${name.toUpperCase()} ${symbol}${formatPrice(price)}`;
          })
          .filter((l): l is string => l !== null);

        if (lines.length === 0) {
          onUpdate(jammedErrorBoard("CRYPTO"));
          return;
        }

        const raw = composeIconTextBoard(lines, COIN_ICON, APP_ICON_WIDTH, APP_ICON_HEIGHT);
        cache.current = { key: cacheKey, raw };
        onUpdate(raw);
      })
      .catch(() => {
        if (!cancelled) onUpdate(jammedErrorBoard("CRYPTO"));
      });

    return () => {
      cancelled = true;
    };
  }, [active, coinIds, vsCurrency, onUpdate]);
}