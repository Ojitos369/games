import { useEffect } from 'react';
import { localStates } from './localStates';
import { Board } from './Board';
import { GameStats } from './GameStats';
import { GameControls } from './GameControls';
import { TopPanels } from './TopPanels';
import { WinOverlay } from './WinOverlay';
import { ShareModal } from './ShareModal';
import { UserRecordsModal } from './UserRecordsModal';

const RushCarPage = () => {
    const { styles, init } = localStates();

    useEffect(() => {
        init();
    }, []);

    return (
        <div className={styles.rushcarPage}>
            <div className={styles.gameSection}>
                <h1 className={styles.title}>🏎️ Rush Car</h1>
                <GameStats />
                <Board />
                <GameControls />
            </div>

            <TopPanels />

            {/* Modals */}
            <WinOverlay />
            <ShareModal />
            <UserRecordsModal />
        </div>
    );
};

export { RushCarPage as RushCar };
