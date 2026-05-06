import { tags as tagsMod } from './tags';
import { tarjetas as tarjetasMod } from './tarjetas';
import { decks as decksMod } from './decks';
import { salas as salasMod } from './salas';

export const adivina = props => {
    const tags = tagsMod(props);
    const tarjetas = tarjetasMod(props);
    const decks = decksMod(props);
    const salas = salasMod(props);
    return { tags, tarjetas, decks, salas };
};
