import Aligner from '../components/Aligner/Aligner';
import CatalogerButton from '../components/CatalogerButton';
import LanguageSelector from '../components/LanguageSelector';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTextSelectionStore } from '../stores/textSelectionStore';

function AlignerPage() {
  const { t } = useTranslation();
  const { isTargetLoaded } = useTextSelectionStore();
  
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b shrink-0">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
         
            <Link to="/" className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <img src="/img/icon.png" alt={t('aligner.title')} className="w-6 h-6" />
          {t('aligner.title')}</Link>
            <div className="flex items-center gap-3">
              <LanguageSelector />
              {!isTargetLoaded && <CatalogerButton />}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        <Aligner />
      </div>
    </div>
  );
}

export default AlignerPage;

