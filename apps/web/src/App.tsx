import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.tsx';
import MoviesPage from './pages/MoviesPage.tsx';
import RewatchPlanPage from './pages/RewatchPlanPage.tsx';
import BookingPage from './pages/BookingPage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/movies" element={<MoviesPage />} />
      <Route path="/rewatch-plan" element={<RewatchPlanPage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
