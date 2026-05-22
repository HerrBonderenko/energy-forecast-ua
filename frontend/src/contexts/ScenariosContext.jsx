import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ScenariosContext = createContext(null);

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json();
}

export function ScenariosProvider({ children }) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Завантажуємо з API при старті
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiRequest('/api/scenarios/')
      .then((data) => {
        if (!cancelled) {
          setScenarios(data.items || []);
          setError(null);
        }
      })
      .catch((e) => {
        console.error('[Scenarios] load error:', e);
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const reload = useCallback(async () => {
    try {
      const data = await apiRequest('/api/scenarios/');
      setScenarios(data.items || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const addScenario = useCallback(async (scenario) => {
    try {
      const newScenario = await apiRequest('/api/scenarios/', {
        method: 'POST',
        body: JSON.stringify({
          name:        scenario.name,
          description: scenario.description || null,
          deltaPct:    scenario.deltaPct ?? 0,
          direction:   scenario.direction || 'neutral',
          curve:       scenario.curve || [],
          deltas:      scenario.deltas || {},
          createdAt:   scenario.createdAt || new Date().toISOString(),
        }),
      });
      setScenarios((prev) => [newScenario, ...prev]);
      return newScenario;
    } catch (e) {
      console.error('[Scenarios] add error:', e);
      throw e;
    }
  }, []);

  const updateScenario = useCallback(async (id, patch) => {
    // PUT не реалізовано на бекенді (поки що тільки локально)
    setScenarios((prev) => prev.map((s) => (String(s.id) === String(id) ? { ...s, ...patch } : s)));
  }, []);

  const deleteScenario = useCallback(async (id) => {
    try {
      await apiRequest(`/api/scenarios/${id}`, { method: 'DELETE' });
      setScenarios((prev) => prev.filter((s) => String(s.id) !== String(id)));
    } catch (e) {
      console.error('[Scenarios] delete error:', e);
      throw e;
    }
  }, []);

  const duplicateScenario = useCallback(async (id) => {
    try {
      const dup = await apiRequest(`/api/scenarios/${id}/duplicate`, { method: 'POST' });
      setScenarios((prev) => [dup, ...prev]);
      return dup;
    } catch (e) {
      console.error('[Scenarios] duplicate error:', e);
      throw e;
    }
  }, []);

  const getScenario = useCallback(
    (id) => scenarios.find((s) => String(s.id) === String(id)) || null,
    [scenarios],
  );

  return (
    <ScenariosContext.Provider
      value={{
        scenarios,
        loading,
        error,
        reload,
        addScenario,
        updateScenario,
        deleteScenario,
        duplicateScenario,
        getScenario,
      }}
    >
      {children}
    </ScenariosContext.Provider>
  );
}

export function useScenarios() {
  const ctx = useContext(ScenariosContext);
  if (!ctx) throw new Error('useScenarios must be used within ScenariosProvider');
  return ctx;
}
