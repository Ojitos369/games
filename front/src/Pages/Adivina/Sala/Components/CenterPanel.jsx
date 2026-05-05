import { subStates } from '../localStates';
import { EsperandoView } from './EsperandoView';
import { JugandoView } from './JugandoView';
import { TerminadoView } from './TerminadoView';
import { EspectadorBanner } from './EspectadorBanner';

export const CenterPanel = () => {
    const { style, gameState, isEspectador } = subStates();

    if (!gameState) return null;

    return (
        <div className={`${style.centerPanel}`}>
            {gameState?.estado === 'esperando' && !isEspectador && <EsperandoView />}
            {gameState?.estado === 'jugando' && !isEspectador && <JugandoView />}
            {gameState?.estado === 'terminado' && <TerminadoView />}
            {isEspectador && gameState?.estado !== 'terminado' && <EspectadorBanner />}
        </div>
    );
};
