import { createContext, useContext, useState, useCallback } from 'react';
import { MOCK_SCENARIOS } from '../lib/mockData';
import { uid } from '../lib/utils';

const ScenariosContext = createContext(null);

export function ScenariosProvider({ children }) {
  const [scenarios, setScenarios] = useState(MOCK_SCENARIOS);

  const addScenario = useCallback((scenario) => {
    const newScenario = {
      id: scenario.id || uid('s'),
      createdAt: scenario.createdAt || new Date().toISOString(),
      ...scenario,
    };
    setScenarios((prev) => [newScenario, ...prev]);
    return newScenario;
  }, []);

  const updateScenario = useCallback((id, patch) => {
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const deleteScenario = useCallback((id) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const duplicateScenario = useCallback((id) => {
    let dup = null;
    setScenarios((prev) => {
      const src = prev.find((s) => s.id === id);
      if (!src) return prev;
      dup = {
        ...src,
        id: uid('s'),
        name: `${src.name} (копія)`,
        createdAt: new Date().toISOString(),
      };
      return [dup, ...prev];
    });
    return dup;
  }, []);

  const getScenario = useCallback(
    (id) => scenarios.find((s) => s.id === id) || null,
    [scenarios],
  );

  return (
    <ScenariosContext.Provider
      value={{
        scenarios,
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
