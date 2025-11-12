import Formatter from '../components/Formatter/Formatter';
import CatalogerButton from '../components/CatalogerButton';
import { Link } from 'react-router-dom';

function FormatterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
         
            <Link to="/" className="text-xl font-semibold text-gray-900">Formatter</Link>
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
