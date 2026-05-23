import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { ScenariosProvider } from './contexts/ScenariosContext';
import Layout from './components/layout/Layout';
import DashboardPage        from './pages/DashboardPage';
import ForecastPage         from './pages/ForecastPage';
import ScenarioAnalysisPage from './pages/ScenarioAnalysisPage';
import ScenariosPage        from './pages/ScenariosPage';
import ComparePage          from './pages/ComparePage';
import InterpretationPage   from './pages/InterpretationPage';
import HistoryPage          from './pages/HistoryPage';
import SettingsPage         from './pages/SettingsPage';
import NotFoundPage         from './pages/NotFoundPage';

// Гарячі клавіші: Alt+1..Alt+8
const HOTKEYS = {
  '1': '/',
  '2': '/forecast',
  '3': '/scenario-analysis',
  '4': '/scenarios',
  '5': '/compare',
  '6': '/interpretation',
  '7': '/history',
  '8': '/settings',
};

function KeyboardNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e) {
      // Alt + цифра
      if (e.altKey && !e.ctrlKey && !e.metaKey && HOTKEYS[e.key]) {
        e.preventDefault();
        navigate(HOTKEYS[e.key]);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ScenariosProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index                    element={<DashboardPage />} />
              <Route path="forecast"          element={<ForecastPage />} />
              <Route path="scenario-analysis" element={<ScenarioAnalysisPage />} />
              <Route path="scenarios"         element={<ScenariosPage />} />
              <Route path="compare"           element={<ComparePage />} />
              <Route path="interpretation"    element={<InterpretationPage />} />
              <Route path="history"           element={<HistoryPage />} />
              <Route path="settings"          element={<SettingsPage />} />
              <Route path="*"                 element={<NotFoundPage />} />
            </Route>
          </Routes>
          <KeyboardNavigation />
        </ScenariosProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
