import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <i className="fas fa-unlink text-gray-400 text-3xl"></i>
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Link Not Found</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          The shortened link you're looking for doesn't exist or has been removed.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <i className="fas fa-home mr-2"></i>
          Go Home
        </Link>
      </div>
    </div>
  );
}
