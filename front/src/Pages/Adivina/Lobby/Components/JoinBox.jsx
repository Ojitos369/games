import { localStates } from '../localStates';

export const JoinBox = () => {
    const { style, joinCode, setJoinCode, handleJoin } = localStates();

    return (
        <div className={`${style.joinSection}`}>
            <div className={`${style.joinBox}`}>
                <span className={`${style.joinIcon}`}>🔑</span>
                <input
                    type="text"
                    placeholder="Código de sala (ej: ABC123)"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    className={`${style.joinInput}`}
                    maxLength={8}
                />
                <button className={`${style.btnSecondary}`} onClick={handleJoin}>
                    Unirse
                </button>
            </div>
        </div>
    );
};
