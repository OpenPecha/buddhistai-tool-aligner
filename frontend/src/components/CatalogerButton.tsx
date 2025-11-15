import { PlusCircle } from 'lucide-react';
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
      className="inline-block w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
      >
      Cataloger
    </button>
  )
}



export default CatalogerButton
