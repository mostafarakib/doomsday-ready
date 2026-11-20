import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
