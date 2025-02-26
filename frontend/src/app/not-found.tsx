export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-brown-100 to-brown-200">
      <h1 className="text-4xl font-bold text-brown-900 mb-4">404 - Page Not Found</h1>
      <p className="text-brown-700 mb-8">The page you're looking for doesn't exist.</p>
      <a 
        href="/discovery"
        className="px-6 py-3 bg-brown-600 text-white rounded-lg hover:bg-brown-700 transition-colors"
      >
        Go to Discovery
      </a>
    </div>
  );
} 