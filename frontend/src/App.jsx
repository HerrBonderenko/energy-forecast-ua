import { Routes, Route } from 'react-router-dom';
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
            </Route>
          </Routes>
        </ScenariosProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
