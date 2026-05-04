export const adivina = props => {
    const { miAxios, s, u1, u2, general } = props;

    const getTags = () => {
        if (s.loadings?.adivina?.tags) return;
        u2('loadings', 'adivina', 'tags', true);
        miAxios.get('games/adivina/tags')
            .then(res => u1('adivina', 'tags', res.data.tags))
            .catch(err => console.log(err))
            .finally(() => u2('loadings', 'adivina', 'tags', false));
    };

    const createTag = (nombre, cb, silent = false) => {
        if (s.loadings?.adivina?.createTag) return;
        u2('loadings', 'adivina', 'createTag', true);
        miAxios.post('games/adivina/tags', { nombre })
            .then(res => {
                if (!silent) general.notificacion({ message: 'Tag creado', title: 'Éxito', mode: 'success' });
                getTags();
                if (cb) cb(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al crear tag';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'createTag', false));
    };

    const deleteTag = (tag_id, cb) => {
        if (s.loadings?.adivina?.deleteTag) return;
        u2('loadings', 'adivina', 'deleteTag', true);
        miAxios.delete('games/adivina/tags', { data: { tag_id } })
            .then(res => {
                general.notificacion({ message: 'Tag eliminado', title: 'Éxito', mode: 'success' });
                getTags();
                if (cb) cb(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al eliminar tag';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'deleteTag', false));
    };

    const getTarjetas = (params = {}) => {
        if (s.loadings?.adivina?.tarjetas) return;
        u2('loadings', 'adivina', 'tarjetas', true);
        const query = new URLSearchParams();
        if (params.q) query.set('q', params.q);
        if (params.tags && params.tags.length) query.set('tags', params.tags.join(','));
        const qs = query.toString() ? `?${query.toString()}` : '';
        miAxios.get(`games/adivina/tarjetas${qs}`)
            .then(res => u1('adivina', 'tarjetas', res.data.tarjetas))
            .catch(err => console.log(err))
            .finally(() => u2('loadings', 'adivina', 'tarjetas', false));
    };

    const createTarjeta = (data, cb) => {
        if (s.loadings?.adivina?.createTarjeta) return;
        u2('loadings', 'adivina', 'createTarjeta', true);
        miAxios.post('games/adivina/tarjetas', data)
            .then(res => {
                general.notificacion({ message: 'Tarjeta creada', title: 'Éxito', mode: 'success' });
                getTarjetas();
                if (cb) cb(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al crear tarjeta';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'createTarjeta', false));
    };

    const updateTarjeta = (data, cb) => {
        if (s.loadings?.adivina?.updateTarjeta) return;
        u2('loadings', 'adivina', 'updateTarjeta', true);
        miAxios.put('games/adivina/tarjetas', data)
            .then(res => {
                general.notificacion({ message: 'Tarjeta actualizada', title: 'Éxito', mode: 'success' });
                getTarjetas();
                if (cb) cb(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al actualizar tarjeta';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'updateTarjeta', false));
    };

    const deleteTarjeta = (tarjeta_id, cb) => {
        if (s.loadings?.adivina?.deleteTarjeta) return;
        u2('loadings', 'adivina', 'deleteTarjeta', true);
        miAxios.delete('games/adivina/tarjetas', { data: { tarjeta_id } })
            .then(res => {
                general.notificacion({ message: 'Tarjeta eliminada', title: 'Éxito', mode: 'success' });
                getTarjetas();
                if (cb) cb(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al eliminar tarjeta';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'deleteTarjeta', false));
    };

    const uploadTarjetaImage = (tarjeta_id, file, cb) => {
        if (s.loadings?.adivina?.uploadImage) return;
        u2('loadings', 'adivina', 'uploadImage', true);
        const formData = new FormData();
        formData.append('file', file);
        miAxios.post(`games/adivina/upload_tarjeta/${tarjeta_id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
            .then(res => {
                general.notificacion({ message: 'Imagen subida', title: 'Éxito', mode: 'success' });
                getTarjetas();
                if (cb) cb(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al subir imagen';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'uploadImage', false));
    };

    const getDecks = () => {
        if (s.loadings?.adivina?.decks) return;
        u2('loadings', 'adivina', 'decks', true);
        miAxios.get('games/adivina/decks')
            .then(res => u1('adivina', 'decks', res.data.decks))
            .catch(err => console.log(err))
            .finally(() => u2('loadings', 'adivina', 'decks', false));
    };

    const createDeck = (data, cb) => {
        if (s.loadings?.adivina?.createDeck) return;
        u2('loadings', 'adivina', 'createDeck', true);
        miAxios.post('games/adivina/decks', data)
            .then(res => {
                general.notificacion({ message: 'Deck creado', title: 'Éxito', mode: 'success' });
                getDecks();
                if (cb) cb(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al crear deck';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'createDeck', false));
    };

    const updateDeck = (data, cb) => {
        if (s.loadings?.adivina?.updateDeck) return;
        u2('loadings', 'adivina', 'updateDeck', true);
        miAxios.put('games/adivina/decks', data)
            .then(res => {
                general.notificacion({ message: 'Deck actualizado', title: 'Éxito', mode: 'success' });
                getDecks();
                if (cb) cb(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al actualizar deck';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'updateDeck', false));
    };

    const deleteDeck = (deck_id, cb) => {
        if (s.loadings?.adivina?.deleteDeck) return;
        u2('loadings', 'adivina', 'deleteDeck', true);
        miAxios.delete('games/adivina/decks', { data: { deck_id } })
            .then(res => {
                general.notificacion({ message: 'Deck eliminado', title: 'Éxito', mode: 'success' });
                getDecks();
                if (cb) cb(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al eliminar deck';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'deleteDeck', false));
    };

    const getDeckTarjetas = (deck_id, cb) => {
        miAxios.get(`games/adivina/decks/${deck_id}/tarjetas`)
            .then(res => { if (cb) cb(res.data.tarjetas); })
            .catch(err => console.log(err));
    };

    const publicarDeck = (deck_id, publico, cb) => {
        if (s.loadings?.adivina?.publicarDeck) return;
        u2('loadings', 'adivina', 'publicarDeck', true);
        miAxios.patch('games/adivina/decks/publicar', { deck_id, publico })
            .then(res => {
                const msg = publico ? 'Deck publicado' : 'Deck privado';
                general.notificacion({ message: msg, title: 'Éxito', mode: 'success' });
                getDecks();
                if (cb) cb(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al actualizar deck';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'publicarDeck', false));
    };

    const getDecksPublicos = (cb) => {
        if (s.loadings?.adivina?.decksPublicos) return;
        u2('loadings', 'adivina', 'decksPublicos', true);
        miAxios.get('games/adivina/decks/publicos')
            .then(res => {
                u1('adivina', 'decksPublicos', res.data.decks);
                if (cb) cb(res.data.decks);
            })
            .catch(err => console.log(err))
            .finally(() => u2('loadings', 'adivina', 'decksPublicos', false));
    };

    const importarDeck = (deck_id, cb) => {
        if (s.loadings?.adivina?.importarDeck) return;
        u2('loadings', 'adivina', 'importarDeck', true);
        miAxios.post('games/adivina/decks/importar', { deck_id })
            .then(res => {
                general.notificacion({ message: 'Deck importado a tu colección', title: 'Éxito', mode: 'success' });
                getDecks();
                getDecksPublicos();
                if (cb) cb(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al importar deck';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'importarDeck', false));
    };

    const desvincularDeck = (deck_id, cb) => {
        if (s.loadings?.adivina?.desvincularDeck) return;
        u2('loadings', 'adivina', 'desvincularDeck', true);
        miAxios.delete('games/adivina/decks/importar', { data: { deck_id } })
            .then(res => {
                general.notificacion({ message: 'Deck desvinculado', title: 'Éxito', mode: 'success' });
                getDecks();
                getDecksPublicos();
                if (cb) cb(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al desvincular deck';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'desvincularDeck', false));
    };

    const copiarDeck = (deck_id, cb) => {
        if (s.loadings?.adivina?.copiarDeck) return;
        u2('loadings', 'adivina', 'copiarDeck', true);
        miAxios.post('games/adivina/decks/copiar', { deck_id })
            .then(res => {
                general.notificacion({ message: 'Deck copiado como tuyo (sin vínculo)', title: 'Éxito', mode: 'success' });
                getDecks();
                if (cb) cb(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al copiar deck';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'copiarDeck', false));
    };

    const getSalas = () => {
        if (s.loadings?.adivina?.salas) return;
        u2('loadings', 'adivina', 'salas', true);
        miAxios.get('games/adivina/salas')
            .then(res => u1('adivina', 'salas', res.data.salas))
            .catch(err => console.log(err))
            .finally(() => u2('loadings', 'adivina', 'salas', false));
    };

    const createSala = (data, cb) => {
        if (s.loadings?.adivina?.createSala) return;
        u2('loadings', 'adivina', 'createSala', true);
        miAxios.post('games/adivina/salas', data)
            .then(res => {
                getSalas();
                if (cb) cb(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al crear sala';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'createSala', false));
    };

    const getSala = (codigo, cb) => {
        miAxios.get(`games/adivina/salas/info?codigo=${codigo}`)
            .then(res => { if (cb) cb(res.data.sala); })
            .catch(err => console.log(err));
    };

    const reaperturarSala = (codigo, cb) => {
        if (s.loadings?.adivina?.reaperturarSala) return;
        u2('loadings', 'adivina', 'reaperturarSala', true);
        miAxios.post('games/adivina/salas/reaperturar', { codigo })
            .then(res => {
                general.notificacion({ message: 'Sala reaperturada con éxito', title: 'Éxito', mode: 'success' });
                if (cb) cb(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al reaperturar sala';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'reaperturarSala', false));
    };

    return {
        getTags, createTag, deleteTag,
        getTarjetas, createTarjeta, updateTarjeta, deleteTarjeta, uploadTarjetaImage,
        getDecks, createDeck, updateDeck, deleteDeck, getDeckTarjetas,
        publicarDeck, getDecksPublicos, importarDeck, desvincularDeck, copiarDeck,
        getSalas, createSala, getSala, reaperturarSala,
    };
};
