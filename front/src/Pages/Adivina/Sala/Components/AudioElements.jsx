import { subStates } from '../localStates';

export const AudioElements = () => {
    const { gameState, userId } = subStates();

    if (!gameState?.jugadores) return null;
    const list = Object.values(gameState.jugadores);

    return (
        <>
            {list.map(j => (
                j.user_id !== userId && <audio key={j.user_id} id={`audio-${j.user_id}`} autoPlay />
            ))}
        </>
    );
};
