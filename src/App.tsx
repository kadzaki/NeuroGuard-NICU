import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from './i18n';
import HomePage from './pages/HomePage';
import PatientPage from './pages/PatientPage';
import './index.css';

function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/patient/:id" element={<PatientPage />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
}

export default App;
