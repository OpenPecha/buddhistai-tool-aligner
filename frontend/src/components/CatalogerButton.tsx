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
    <button onClick={handleOpenCataloger} className='cursor-pointer flex gap-2 items-center px-4 py-2 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors'>
      <PlusCircle className="w-6 h-6 text-gray-500" /> {t('aligner.createText')}
    </button>
  )
}

export default CatalogerButton
