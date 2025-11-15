import { CATALOGER_URL } from '../config';
import { useTranslation } from 'react-i18next';

function CatalogerButton() {
    const { t } = useTranslation();
    const catalogerUrl = `${CATALOGER_URL}/create`;
    const handleOpenCataloger = () => {
        window.open(catalogerUrl, '_blank');
    }
  return (
    <button 
      onClick={handleOpenCataloger} 
      className="inline-block w-full px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200"
      >
      {t('home.cataloger.button')}
    </button>
  )
}



export default CatalogerButton
