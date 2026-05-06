export const imagenes = props => {
    const { miAxios, s, u2, general, juegos } = props;

    const subir = (juego_id, file, imageData, cb) => {
        if (s.loadings?.catalog?.uploadImage) return;
        u2("loadings", "catalog", "uploadImage", true);

        const formData = new FormData();
        formData.append('file', file);

        miAxios.post(`catalog/upload_image/${juego_id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
            .then(res => {
                miAxios.post('catalog/imagenes', {
                    juego_id,
                    nombre: file.name,
                    ...imageData,
                }).then(() => {
                    general.notificacion({ message: "Imagen subida correctamente", title: "Éxito", mode: "success" });
                    juegos.listar();
                    cb?.(res.data);
                });
            })
            .catch(err => {
                const message = err?.response?.data?.detail || "Error al subir imagen";
                general.notificacion({ message, title: "Error", mode: "danger" });
            })
            .finally(() => u2("loadings", "catalog", "uploadImage", false));
    };

    const eliminar = (imagen_id, cb) => {
        if (s.loadings?.catalog?.eliminarImagen) return;
        u2("loadings", "catalog", "eliminarImagen", true);
        miAxios.delete('catalog/imagenes', { data: { imagen_id } })
            .then(res => {
                general.notificacion({ message: "Imagen eliminada correctamente", title: "Éxito", mode: "success" });
                juegos.listar();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || "Error al eliminar imagen";
                general.notificacion({ message, title: "Error", mode: "danger" });
            })
            .finally(() => u2("loadings", "catalog", "eliminarImagen", false));
    };

    return { subir, eliminar };
};
