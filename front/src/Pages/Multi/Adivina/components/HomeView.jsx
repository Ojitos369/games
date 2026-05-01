import { useState } from 'react';

export const HomeView = ({ ls, joinMode }) => {
    const { styles, setView, joinRoom, createRoom, f } = ls;
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const handleJoin = () => {
        const c = code.trim().toUpperCase();
        if (c.length < 4) { setError('Ingresa un codigo valido'); return; }
        setError('');
        joinRoom(c);
    };

    if (joinMode) {
        return (
            <div className={styles.joinForm}>
                <h2>Unirse a Sala</h2>
                <input
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="Codigo de sala"
                    maxLength={8}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    autoFocus
                />
                {error && <p style={{ color: 'var(--my-danger)', textAlign: 'center', margin: 0, fontSize: '0.85rem' }}>{error}</p>}
                <button className={`${styles.btn} ${styles.primary}`} onClick={handleJoin}>Entrar</button>
                <button className={`${styles.btn} ${styles.ghost}`} onClick={() => setView('home')}>Cancelar</button>
            </div>
        );
    }

    return (
        <div className={styles.homeGrid}>
            <div className={styles.homeCard} onClick={createRoom}>
                <span className={styles.icon}>🏠</span>
                <h2>Crear Sala</h2>
                <p>Crea una sala y comparte el codigo con tus amigos</p>
            </div>
            <div className={styles.homeCard} onClick={() => setView('join')}>
                <span className={styles.icon}>🚪</span>
                <h2>Unirse</h2>
                <p>Ingresa el codigo de sala para unirte a una partida</p>
            </div>
            <div className={styles.homeCard} onClick={() => { f.adivina.listCards(); setView('cards'); }}>
                <span className={styles.icon}>🃏</span>
                <h2>Tarjetas</h2>
                <p>Gestiona el catalogo de personajes</p>
            </div>
            <div className={styles.homeCard} onClick={() => { f.adivina.listDecks(); setView('decks'); }}>
                <span className={styles.icon}>📦</span>
                <h2>Mazos</h2>
                <p>Crea y gestiona colecciones de tarjetas</p>
            </div>
        </div>
    );
};
