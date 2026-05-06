export const tags = props => {
    const { miAxios, s, u1, u2, general } = props;

    const listar = () => {
        if (s.loadings?.adivina?.tags) return;
        u2('loadings', 'adivina', 'tags', true);
        miAxios.get('games/adivina/tags')
            .then(res => u1('adivina', 'tags', res.data.tags))
            .catch(err => console.log(err))
            .finally(() => u2('loadings', 'adivina', 'tags', false));
    };

    const crear = (nombre, cb, silent = false) => {
        if (s.loadings?.adivina?.crearTag) return;
        u2('loadings', 'adivina', 'crearTag', true);
        miAxios.post('games/adivina/tags', { nombre })
            .then(res => {
                if (!silent) general.notificacion({ message: 'Tag creado', title: 'Éxito', mode: 'success' });
                listar();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al crear tag';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'crearTag', false));
    };

    const eliminar = (tag_id, cb) => {
        if (s.loadings?.adivina?.eliminarTag) return;
        u2('loadings', 'adivina', 'eliminarTag', true);
        miAxios.delete('games/adivina/tags', { data: { tag_id } })
            .then(res => {
                general.notificacion({ message: 'Tag eliminado', title: 'Éxito', mode: 'success' });
                listar();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al eliminar tag';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'eliminarTag', false));
    };

    return { listar, crear, eliminar };
};
