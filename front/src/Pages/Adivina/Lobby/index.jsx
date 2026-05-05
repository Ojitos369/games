import { localEffects } from './localStates';
import { LobbyHeader } from './Components/LobbyHeader';
import { JoinBox } from './Components/JoinBox';
import { SalasList } from './Components/SalasList';
import { CreateSalaModal } from './Components/CreateSalaModal';
import { localStates } from './localStates';

export const Lobby = () => {
    const { style } = localStates();
    localEffects();

    return (
        <div className={`${style.lobbyPage}`}>
            <LobbyHeader />
            <JoinBox />
            <SalasList />
            <CreateSalaModal />
        </div>
    );
};
