import { Routes, Route } from 'react-router-dom';
import { Lobby } from './Lobby';
import { Tarjetas } from './Tarjetas';
import { Decks } from './Decks';
import { localEffects } from './localStates';

export const Adivina = () => {
    localEffects();
    return (
        <Routes>
            <Route path="" element={<Lobby />} />
            <Route path="tarjetas" element={<Tarjetas />} />
            <Route path="decks" element={<Decks />} />
        </Routes>
    );
};
