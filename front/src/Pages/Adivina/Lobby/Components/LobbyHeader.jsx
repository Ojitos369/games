import { localStates } from '../localStates';

export const LobbyHeader = () => {
    const { style, setShowCreateModal } = localStates();

    return (
        <div className={`${style.lobbyHeader}`}>
            <div>
                <h1 className={`${style.lobbyTitle}`}>Adivina la <span className={style.accent}>Tarjeta</span></h1>
                <p className={`${style.lobbySubtitle}`}>Juega con amigos en tiempo real — adivina quién es antes de que te adivinen a ti</p>
                <div className={`${style.lobbyOptions}`}>
                    <button className={`${style.btnOption}`} onClick={() => window.location.hash = '#/adivina/tarjetas'}>
                        🗂️ Gestionar Tarjetas
                    </button>
                    <button className={`${style.btnOption}`} onClick={() => window.location.hash = '#/adivina/decks'}>
                        🃏 Gestionar Decks
                    </button>
                </div>
            </div>
            <button className={`${style.btnPrimary}`} onClick={() => setShowCreateModal(true)}>
                + Crear Sala
            </button>
        </div>
    );
};
