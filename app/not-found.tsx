import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-blue-700">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mt-4">Page Not Found</h2>
        <p className="text-gray-600 mt-2">The page you are looking for does not exist.</p>
        <Link href="/" className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700">
          Return Home
        </Link>
      </div>
    </main>
  );
}
