export const tarjetas = props => {
    const { miAxios, s, u1, u2, general } = props;

    const listar = (params, cb) => {
        if (s.loadings?.adivina?.tarjetas) return;
        const finalParams = params ?? (s.adivina?.tarjetasLastParams || {});
        u2('loadings', 'adivina', 'tarjetas', true);
        u1('adivina', 'tarjetasLastParams', finalParams);
        const query = new URLSearchParams();
        if (finalParams.q) query.set('q', finalParams.q);
        if (finalParams.tags && finalParams.tags.length) query.set('tags', finalParams.tags.join(','));
        if (finalParams.tag_mode) query.set('tag_mode', finalParams.tag_mode);
        if (finalParams.scope) query.set('scope', finalParams.scope);
        if (finalParams.sort_by) query.set('sort_by', finalParams.sort_by);
        if (finalParams.page) query.set('page', String(finalParams.page));
        if (finalParams.page_size) query.set('page_size', String(finalParams.page_size));
        const qs = query.toString() ? `?${query.toString()}` : '';
        miAxios.get(`games/adivina/tarjetas${qs}`)
            .then(res => {
                u1('adivina', 'tarjetas', res.data.tarjetas);
                u1('adivina', 'tarjetasMeta', {
                    total: res.data.total ?? (res.data.tarjetas?.length || 0),
                    page: res.data.page ?? 1,
                    page_size: res.data.page_size ?? (res.data.tarjetas?.length || 0),
                    pages: res.data.pages ?? 1,
                    scope_counts: res.data.scope_counts || { all: 0, mine: 0, no_image: 0, no_tags: 0 },
                });
                cb?.(res.data);
            })
            .catch(err => console.log(err))
            .finally(() => u2('loadings', 'adivina', 'tarjetas', false));
    };

    const listarLite = (params = {}, cb) => {
        const query = new URLSearchParams();
        if (params.q) query.set('q', params.q);
        if (params.tags && params.tags.length) query.set('tags', params.tags.join(','));
        if (params.tag_mode) query.set('tag_mode', params.tag_mode);
        if (params.page) query.set('page', String(params.page));
        if (params.page_size) query.set('page_size', String(params.page_size));
        if (params.sort_by) query.set('sort_by', params.sort_by);
        const qs = query.toString() ? `?${query.toString()}` : '';
        miAxios.get(`games/adivina/tarjetas${qs}`)
            .then(res => cb?.(res.data))
            .catch(err => {
                console.log(err);
                cb?.({ tarjetas: [], total: 0, page: 1, pages: 1 });
            });
    };

    const crear = (data, cb) => {
        if (s.loadings?.adivina?.crearTarjeta) return;
        u2('loadings', 'adivina', 'crearTarjeta', true);
        miAxios.post('games/adivina/tarjetas', data)
            .then(res => {
                general.notificacion({ message: 'Tarjeta creada', title: 'Éxito', mode: 'success' });
                listar();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al crear tarjeta';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'crearTarjeta', false));
    };

    const actualizar = (data, cb) => {
        if (s.loadings?.adivina?.actualizarTarjeta) return;
        u2('loadings', 'adivina', 'actualizarTarjeta', true);
        miAxios.put('games/adivina/tarjetas', data)
            .then(res => {
                general.notificacion({ message: 'Tarjeta actualizada', title: 'Éxito', mode: 'success' });
                listar();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al actualizar tarjeta';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'actualizarTarjeta', false));
    };

    const eliminar = (tarjeta_id, cb) => {
        if (s.loadings?.adivina?.eliminarTarjeta) return;
        u2('loadings', 'adivina', 'eliminarTarjeta', true);
        miAxios.delete('games/adivina/tarjetas', { data: { tarjeta_id } })
            .then(res => {
                general.notificacion({ message: 'Tarjeta eliminada', title: 'Éxito', mode: 'success' });
                listar();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al eliminar tarjeta';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'eliminarTarjeta', false));
    };

    const subirImagen = (tarjeta_id, file, cb) => {
        if (s.loadings?.adivina?.uploadImage) return;
        u2('loadings', 'adivina', 'uploadImage', true);
        const formData = new FormData();
        formData.append('file', file);
        miAxios.post(`games/adivina/upload_tarjeta/${tarjeta_id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
            .then(res => {
                general.notificacion({ message: 'Imagen subida', title: 'Éxito', mode: 'success' });
                listar();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al subir imagen';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'uploadImage', false));
    };

    return { listar, listarLite, crear, actualizar, eliminar, subirImagen };
};
