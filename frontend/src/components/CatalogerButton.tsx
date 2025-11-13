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
      className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out active:scale-95'
    >
      <PlusCircle className="w-4 h-4" /> 
      {t('aligner.createText')}
    </button>
  )
}

export default CatalogerButton
