import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
      <p className="text-6xl font-black text-[#dc2626]">404</p>
      <p className="text-lg text-[#a3a3a3]">Page not found.</p>
      <Link
        to="/"
        className="mt-2 px-4 py-2 rounded bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm font-medium transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
