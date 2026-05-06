export const juegos = props => {
    const { miAxios, s, u1, u2, general } = props;

    const listar = () => {
        if (s.loadings?.catalog?.juegos) return;
        u2("loadings", "catalog", "juegos", true);
        miAxios.get('catalog/juegos')
            .then(res => u1("catalog", "juegos", res.data.juegos))
            .catch(err => console.log(err))
            .finally(() => u2("loadings", "catalog", "juegos", false));
    };

    const obtener = (data) => miAxios.get('catalog/juego', { params: data })
        .then(res => res.data)
        .catch(err => { console.log(err); return null; });

    const crear = (data, cb) => {
        if (s.loadings?.catalog?.crear) return;
        u2("loadings", "catalog", "crear", true);
        miAxios.post('catalog/juegos', data)
            .then(res => {
                general.notificacion({ message: "Juego creado correctamente", title: "Éxito", mode: "success" });
                listar();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || "Error al crear juego";
                general.notificacion({ message, title: "Error", mode: "danger" });
            })
            .finally(() => u2("loadings", "catalog", "crear", false));
    };

    const actualizar = (data, cb) => {
        if (s.loadings?.catalog?.actualizar) return;
        u2("loadings", "catalog", "actualizar", true);
        miAxios.put('catalog/juegos', data)
            .then(res => {
                general.notificacion({ message: "Juego actualizado correctamente", title: "Éxito", mode: "success" });
                listar();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || "Error al actualizar juego";
                general.notificacion({ message, title: "Error", mode: "danger" });
            })
            .finally(() => u2("loadings", "catalog", "actualizar", false));
    };

    const eliminar = (juego_id, cb) => {
        if (s.loadings?.catalog?.eliminar) return;
        u2("loadings", "catalog", "eliminar", true);
        miAxios.delete('catalog/juegos', { data: { juego_id } })
            .then(res => {
                general.notificacion({ message: "Juego eliminado correctamente", title: "Éxito", mode: "success" });
                listar();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || "Error al eliminar juego";
                general.notificacion({ message, title: "Error", mode: "danger" });
            })
            .finally(() => u2("loadings", "catalog", "eliminar", false));
    };

    const toggleFavorito = (juego_id, cb) => {
        if (s.loadings?.catalog?.toggleFavorito) return;
        u2("loadings", "catalog", "toggleFavorito", true);
        return miAxios.post('catalog/favoritos', { juego_id })
            .then(res => {
                listar();
                cb?.(res.data);
                return res.data;
            })
            .catch(err => console.log(err))
            .finally(() => u2("loadings", "catalog", "toggleFavorito", false));
    };

    const calificar = (data, cb) => {
        if (s.loadings?.catalog?.calificar) return;
        u2("loadings", "catalog", "calificar", true);
        return miAxios.post('catalog/calificacion', data)
            .then(res => {
                cb?.(res.data);
                return res.data;
            })
            .catch(err => {
                const message = err?.response?.data?.detail || "Error al guardar calificación";
                general.notificacion({ message, title: "Error", mode: "danger" });
            })
            .finally(() => u2("loadings", "catalog", "calificar", false));
    };

    return { listar, obtener, crear, actualizar, eliminar, toggleFavorito, calificar };
};
