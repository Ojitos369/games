export const decks = props => {
    const { miAxios, s, u1, u2, general } = props;

    const listar = (params, cb) => {
        if (s.loadings?.adivina?.decks) return;
        const finalParams = params ?? (s.adivina?.decksLastParams || {});
        u2('loadings', 'adivina', 'decks', true);
        u1('adivina', 'decksLastParams', finalParams);
        const query = new URLSearchParams();
        if (finalParams.q) query.set('q', finalParams.q);
        if (finalParams.scope) query.set('scope', finalParams.scope);
        if (finalParams.sort_by) query.set('sort_by', finalParams.sort_by);
        if (finalParams.page) query.set('page', String(finalParams.page));
        if (finalParams.page_size) query.set('page_size', String(finalParams.page_size));
        const qs = query.toString() ? `?${query.toString()}` : '';
        miAxios.get(`games/adivina/decks${qs}`)
            .then(res => {
                u1('adivina', 'decks', res.data.decks);
                u1('adivina', 'decksMeta', {
                    total: res.data.total ?? (res.data.decks?.length || 0),
                    page: res.data.page ?? 1,
                    page_size: res.data.page_size ?? (res.data.decks?.length || 0),
                    pages: res.data.pages ?? 1,
                    scope_counts: res.data.scope_counts || { all: 0, owned: 0, imported: 0 },
                });
                cb?.(res.data);
            })
            .catch(err => console.log(err))
            .finally(() => u2('loadings', 'adivina', 'decks', false));
    };

    const crear = (data, cb) => {
        if (s.loadings?.adivina?.crearDeck) return;
        u2('loadings', 'adivina', 'crearDeck', true);
        miAxios.post('games/adivina/decks', data)
            .then(res => {
                general.notificacion({ message: 'Deck creado', title: 'Éxito', mode: 'success' });
                listar();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al crear deck';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'crearDeck', false));
    };

    const actualizar = (data, cb) => {
        if (s.loadings?.adivina?.actualizarDeck) return;
        u2('loadings', 'adivina', 'actualizarDeck', true);
        miAxios.put('games/adivina/decks', data)
            .then(res => {
                general.notificacion({ message: 'Deck actualizado', title: 'Éxito', mode: 'success' });
                listar();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al actualizar deck';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'actualizarDeck', false));
    };

    const eliminar = (deck_id, cb) => {
        if (s.loadings?.adivina?.eliminarDeck) return;
        u2('loadings', 'adivina', 'eliminarDeck', true);
        miAxios.delete('games/adivina/decks', { data: { deck_id } })
            .then(res => {
                general.notificacion({ message: 'Deck eliminado', title: 'Éxito', mode: 'success' });
                listar();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al eliminar deck';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'eliminarDeck', false));
    };

    const tarjetas = (deck_id, cb) => {
        miAxios.get(`games/adivina/decks/${deck_id}/tarjetas`)
            .then(res => cb?.(res.data.tarjetas))
            .catch(err => console.log(err));
    };

    const publicar = (deck_id, publico, cb) => {
        if (s.loadings?.adivina?.publicarDeck) return;
        u2('loadings', 'adivina', 'publicarDeck', true);
        miAxios.patch('games/adivina/decks/publicar', { deck_id, publico })
            .then(res => {
                const msg = publico ? 'Deck publicado' : 'Deck privado';
                general.notificacion({ message: msg, title: 'Éxito', mode: 'success' });
                listar();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al actualizar deck';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'publicarDeck', false));
    };

    const listarPublicos = (params, cb) => {
        if (s.loadings?.adivina?.decksPublicos) return;
        const finalParams = params ?? (s.adivina?.decksPublicosLastParams || {});
        u2('loadings', 'adivina', 'decksPublicos', true);
        u1('adivina', 'decksPublicosLastParams', finalParams);
        const query = new URLSearchParams();
        if (finalParams.q) query.set('q', finalParams.q);
        if (finalParams.sort_by) query.set('sort_by', finalParams.sort_by);
        if (finalParams.only_new) query.set('only_new', '1');
        if (finalParams.page) query.set('page', String(finalParams.page));
        if (finalParams.page_size) query.set('page_size', String(finalParams.page_size));
        const qs = query.toString() ? `?${query.toString()}` : '';
        miAxios.get(`games/adivina/decks/publicos${qs}`)
            .then(res => {
                u1('adivina', 'decksPublicos', res.data.decks);
                u1('adivina', 'decksPublicosMeta', {
                    total: res.data.total ?? (res.data.decks?.length || 0),
                    page: res.data.page ?? 1,
                    page_size: res.data.page_size ?? (res.data.decks?.length || 0),
                    pages: res.data.pages ?? 1,
                });
                cb?.(res.data);
            })
            .catch(err => console.log(err))
            .finally(() => u2('loadings', 'adivina', 'decksPublicos', false));
    };

    const importar = (deck_id, cb) => {
        if (s.loadings?.adivina?.importarDeck) return;
        u2('loadings', 'adivina', 'importarDeck', true);
        miAxios.post('games/adivina/decks/importar', { deck_id })
            .then(res => {
                general.notificacion({ message: 'Deck importado a tu colección', title: 'Éxito', mode: 'success' });
                listar();
                listarPublicos();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al importar deck';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'importarDeck', false));
    };

    const desvincular = (deck_id, cb) => {
        if (s.loadings?.adivina?.desvincularDeck) return;
        u2('loadings', 'adivina', 'desvincularDeck', true);
        miAxios.delete('games/adivina/decks/importar', { data: { deck_id } })
            .then(res => {
                general.notificacion({ message: 'Deck desvinculado', title: 'Éxito', mode: 'success' });
                listar();
                listarPublicos();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al desvincular deck';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'desvincularDeck', false));
    };

    const copiar = (deck_id, cb) => {
        if (s.loadings?.adivina?.copiarDeck) return;
        u2('loadings', 'adivina', 'copiarDeck', true);
        miAxios.post('games/adivina/decks/copiar', { deck_id })
            .then(res => {
                general.notificacion({ message: 'Deck copiado como tuyo (sin vínculo)', title: 'Éxito', mode: 'success' });
                listar();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al copiar deck';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'copiarDeck', false));
    };

    return {
        listar, crear, actualizar, eliminar, tarjetas,
        publicar, listarPublicos, importar, desvincular, copiar,
    };
};
