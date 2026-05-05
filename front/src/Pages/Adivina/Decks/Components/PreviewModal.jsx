import { localStates, getImageUrl } from '../localStates';
import { ImageModal } from '../../Components/ImageModal';

export const PreviewModal = () => {
    const { showImageModal, setShowImageModal, previewTarget } = localStates();

    return (
        <ImageModal
            show={showImageModal}
            onClose={() => setShowImageModal(false)}
            image={previewTarget ? getImageUrl(previewTarget) : null}
            title={previewTarget?.nombre}
            description={previewTarget?.descripcion}
            tags={previewTarget?.tags}
        />
    );
};
