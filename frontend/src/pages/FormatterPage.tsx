import Formatter from '../components/Formatter/Formatter';
import CatalogerButton from '../components/CatalogerButton';
import LanguageSelector from '../components/LanguageSelector';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function FormatterPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
         
            <Link to="/" className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <img src="/img/icon.png" alt={t('formatter.title')} className="w-6 h-6" />
          {t('formatter.title')}</Link>
            <div className="flex items-center gap-3">
              <LanguageSelector />
              <CatalogerButton />
            </div>
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
