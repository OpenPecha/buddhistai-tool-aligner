import { Link, useSearchParams } from 'react-router-dom';
import Formatter from '../components/Formatter/Formatter';
import CatalogerButton from '../components/CatalogerButton';

function FormatterPage() {
  const [searchParams] = useSearchParams();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link
                to={`/?${searchParams.toString()}`}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </Link>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Formatter</h1>
            <CatalogerButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Formatter />
      </main>
    </div>
  );
}

export default FormatterPage;
