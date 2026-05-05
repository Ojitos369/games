import { useEffect } from 'react';
import { localStates } from './localStates';
import { ImageModal } from '../Components/ImageModal';
import { SalaHeader } from './Components/SalaHeader';
import { PlayersStrip } from './Components/PlayersStrip';
import { CenterPanel } from './Components/CenterPanel';
import { AudioElements } from './Components/AudioElements';
import { AdivinarModal } from './Components/AdivinarModal';
import { GameOverModal } from './Components/GameOverModal';
import { RoomNotFoundView } from './Components/RoomNotFoundView';

export const AdivinaSala = () => {
    const ls = localStates();

    useEffect(() => {
        ls.loadTarjetas();
    }, []);

    const {
        style, roomNotFound,
        showImageModal, setShowImageModal, previewTarget, getImageUrl,
    } = ls;

    if (roomNotFound) return <RoomNotFoundView />;

    return (
        <div className={`${style.salaPage}`}>
            <AudioElements />
            <SalaHeader />
            <div className={`${style.salaBody}`}>
                <PlayersStrip />
                <CenterPanel />
            </div>
            <AdivinarModal />
            <GameOverModal />
            <ImageModal
                show={showImageModal}
                onClose={() => setShowImageModal(false)}
                image={getImageUrl(previewTarget)}
                title={previewTarget?.nombre}
                description={previewTarget?.descripcion}
                tags={previewTarget?.tags}
            />
        </div>
    );
};
