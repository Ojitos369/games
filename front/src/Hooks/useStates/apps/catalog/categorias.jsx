export const categorias = props => {
    const { miAxios, s, u1, u2, general } = props;

    const listar = () => {
        if (s.loadings?.catalog?.categorias) return;
        u2("loadings", "catalog", "categorias", true);
        miAxios.get('catalog/categorias')
            .then(res => u1("catalog", "categorias", res.data.categorias))
            .catch(err => console.log(err))
            .finally(() => u2("loadings", "catalog", "categorias", false));
    };

    const crear = (data, cb) => {
        if (s.loadings?.catalog?.crearCategoria) return;
        u2("loadings", "catalog", "crearCategoria", true);
        miAxios.post('catalog/categorias', data)
            .then(res => {
                general.notificacion({ message: "Categoría creada correctamente", title: "Éxito", mode: "success" });
                listar();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || "Error al crear categoría";
                general.notificacion({ message, title: "Error", mode: "danger" });
            })
            .finally(() => u2("loadings", "catalog", "crearCategoria", false));
    };

    const actualizar = (data, cb) => {
        if (s.loadings?.catalog?.actualizarCategoria) return;
        u2("loadings", "catalog", "actualizarCategoria", true);
        miAxios.put('catalog/categorias', data)
            .then(res => {
                general.notificacion({ message: "Categoría actualizada correctamente", title: "Éxito", mode: "success" });
                listar();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || "Error al actualizar categoría";
                general.notificacion({ message, title: "Error", mode: "danger" });
            })
            .finally(() => u2("loadings", "catalog", "actualizarCategoria", false));
    };

    const eliminar = (categoria_id, cb) => {
        if (s.loadings?.catalog?.eliminarCategoria) return;
        u2("loadings", "catalog", "eliminarCategoria", true);
        miAxios.delete('catalog/categorias', { data: { categoria_id } })
            .then(res => {
                general.notificacion({ message: "Categoría eliminada correctamente", title: "Éxito", mode: "success" });
                listar();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || "Error al eliminar categoría";
                general.notificacion({ message, title: "Error", mode: "danger" });
            })
            .finally(() => u2("loadings", "catalog", "eliminarCategoria", false));
    };

    return { listar, crear, actualizar, eliminar };
};
