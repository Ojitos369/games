import { localStates } from './localStates';
import { HomeView } from './components/HomeView';
import { LobbyView } from './components/LobbyView';
import { GameView } from './components/GameView';
import { CardManager } from './components/CardManager';
import { DeckManager } from './components/DeckManager';

const AdivinaPage = () => {
    const ls = localStates();
    const { styles, view, setView } = ls;

    const titles = {
        home:  'Adivina el Personaje',
        join:  'Unirse a Sala',
        lobby: `Sala: ${ls.room?.code ?? ''}`,
        game:  `Turno ${ls.room?.game?.turn_number ?? 1}`,
        cards: 'Tarjetas',
        decks: 'Mazos',
    };

    const handleBack = () => {
        if ((view === 'game' || view === 'lobby') && !confirm('Salir de la sala?')) return;
        if (view === 'home') { window.location.href = '/'; return; }
        setView('home');
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={handleBack}>
                    ← {view === 'home' ? 'Biblioteca' : 'Inicio'}
                </button>
                <h1>{titles[view] ?? 'Adivina el Personaje'}</h1>
            </div>

            {view === 'home'  && <HomeView ls={ls} />}
            {view === 'join'  && <HomeView ls={ls} joinMode />}
            {view === 'lobby' && <LobbyView ls={ls} />}
            {view === 'game'  && <GameView ls={ls} />}
            {view === 'cards' && <CardManager ls={ls} />}
            {view === 'decks' && <DeckManager ls={ls} />}
        </div>
    );
};

export { AdivinaPage as Adivina };
