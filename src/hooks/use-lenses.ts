"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CustomLens, Lens } from "@/features/lenses/types";
import { composeLensPrompt } from "@/features/lenses/compose";
import { PRESET_LENS_MAP, PRESET_LENSES } from "@/features/lenses/constants";

export function useLenses(conversationId: string | null) {
  // activeLensIds persisted to localStorage keyed by conversationId
  const storageKey = conversationId ? `lenses-${conversationId}` : "lenses-new";

  const [activeLensIds, setActiveLensIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const [customLenses, setCustomLenses] = useState<CustomLens[]>([]);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setActiveLensIds(JSON.parse(stored) as string[]);
      }
    } catch {
      // Ignore parse errors
    }
    setHydrated(true);
  }, [storageKey]);

  // Persist to localStorage (only after hydration to avoid overwriting with [])
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(storageKey, JSON.stringify(activeLensIds));
    }
  }, [storageKey, activeLensIds, hydrated]);

  // Fetch custom lenses on mount
  useEffect(() => {
    const fetchCustom = async () => {
      setIsLoadingCustom(true);
      try {
        const res = await fetch("/api/lenses");
        if (res.ok) {
          const data = (await res.json()) as Lens[];
          const custom = data.filter((l): l is CustomLens => "originalInput" in l);
          setCustomLenses(custom);
        }
      } catch {
        // Silent fail — presets still work
      } finally {
        setIsLoadingCustom(false);
      }
    };
    void fetchCustom();
  }, []);

  // All available lenses
  const allLenses = useMemo<Lens[]>(() => [...PRESET_LENSES, ...customLenses], [customLenses]);

  // Resolved active lenses
  const activeLenses = useMemo<Lens[]>(() => {
    return activeLensIds
      .map((id) => {
        const preset = PRESET_LENS_MAP.get(id);
        if (preset) {
          return preset;
        }
        return customLenses.find((c) => c.id === id);
      })
      .filter((l): l is Lens => l !== undefined);
  }, [activeLensIds, customLenses]);

  // Computed composed prompt for display
  const composedPrompt = useMemo(() => composeLensPrompt(activeLenses), [activeLenses]);

  const toggleLens = useCallback((id: string) => {
    setActiveLensIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 5 ? prev : [...prev, id],
    );
  }, []);

  const clearLenses = useCallback(() => {
    setActiveLensIds([]);
  }, []);

  const addCustomLens = useCallback((lens: CustomLens) => {
    setCustomLenses((prev) => [...prev, lens]);
  }, []);

  const removeCustomLens = useCallback(async (id: string) => {
    try {
      await fetch(`/api/lenses/${id}`, { method: "DELETE" });
      setCustomLenses((prev) => prev.filter((l) => l.id !== id));
      setActiveLensIds((prev) => prev.filter((x) => x !== id));
    } catch {
      // Silent fail
    }
  }, []);

  return {
    allLenses,
    activeLensIds,
    activeLenses,
    composedPrompt,
    customLenses,
    isLoadingCustom,
    toggleLens,
    clearLenses,
    addCustomLens,
    removeCustomLens,
  };
}
