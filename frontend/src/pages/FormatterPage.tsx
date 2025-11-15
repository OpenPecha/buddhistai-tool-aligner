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
     

      {/* Main Content */}
      <main className="flex-1">
        <Formatter />
      </main>
    </div>
  );
}

export default FormatterPage;
