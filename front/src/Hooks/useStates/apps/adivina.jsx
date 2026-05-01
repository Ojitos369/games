const BASE = 'games/adivina';

export const adivina = props => {
    const { miAxios, u2, u3 } = props;

    const listCards = (params = {}) => {
        const { tags = '', search = '' } = params;
        const q = [];
        if (tags) q.push(`tags=${encodeURIComponent(tags)}`);
        if (search) q.push(`search=${encodeURIComponent(search)}`);
        const url = `${BASE}/cards${q.length ? '?' + q.join('&') : ''}`;
        u2('adivina', 'cards', 'loading', true);
        miAxios.get(url)
            .then(res => {
                u2('adivina', 'cards', 'list', res.data.cards);
                u2('adivina', 'cards', 'allTags', res.data.tags);
                u2('adivina', 'cards', 'loading', false);
            })
            .catch(() => u2('adivina', 'cards', 'loading', false));
    };

    const createCard = (data, cb) => {
        miAxios.post(`${BASE}/cards`, data)
            .then(res => { listCards(); cb && cb(res.data); })
            .catch(err => console.error(err));
    };

    const updateCard = (data, cb) => {
        miAxios.put(`${BASE}/cards`, data)
            .then(res => { listCards(); cb && cb(res.data); })
            .catch(err => console.error(err));
    };

    const deleteCard = (id, cb) => {
        miAxios.delete(`${BASE}/cards`, { data: { id } })
            .then(res => { listCards(); cb && cb(res.data); })
            .catch(err => console.error(err));
    };

    const uploadCardImage = async (cardId, file) => {
        const fd = new FormData();
        fd.append('file', file);
        const res = await miAxios.post(`${BASE}/cards/upload/${cardId}`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data.url;
    };

    const listDecks = () => {
        miAxios.get(`${BASE}/decks`)
            .then(res => u2('adivina', 'decks', 'list', res.data.decks))
            .catch(err => console.error(err));
    };

    const createDeck = (data, cb) => {
        miAxios.post(`${BASE}/decks`, data)
            .then(res => { listDecks(); cb && cb(res.data); })
            .catch(err => console.error(err));
    };

    const updateDeck = (data, cb) => {
        miAxios.put(`${BASE}/decks`, data)
            .then(res => { listDecks(); cb && cb(res.data); })
            .catch(err => console.error(err));
    };

    const deleteDeck = (id, cb) => {
        miAxios.delete(`${BASE}/decks`, { data: { id } })
            .then(res => { listDecks(); cb && cb(res.data); })
            .catch(err => console.error(err));
    };

    const getDeckCards = (id, cb) => {
        miAxios.get(`${BASE}/decks/cards?id=${id}`)
            .then(res => cb && cb(res.data.cards))
            .catch(err => console.error(err));
    };

    const createRoom = (cb) => {
        miAxios.post(`${BASE}/rooms`)
            .then(res => cb && cb(res.data))
            .catch(err => console.error(err));
    };

    const getRoom = (code, cb, errCb) => {
        miAxios.get(`${BASE}/rooms?code=${code}`)
            .then(res => cb && cb(res.data.room))
            .catch(err => errCb && errCb(err));
    };

    return {
        listCards, createCard, updateCard, deleteCard, uploadCardImage,
        listDecks, createDeck, updateDeck, deleteDeck, getDeckCards,
        createRoom, getRoom,
    };
};
