export const catalog = props => {
    const { miAxios, s, u0, u1, u2, general } = props;

    const getJuegos = () => {
        if (s.loadings?.catalog?.juegos) return;
        u2("loadings", "catalog", "juegos", true);
        miAxios.get("catalog/juegos")
        .then(res => {
            u1("catalog", "juegos", res.data.juegos);
        })
        .catch(err => {
            console.log(err);
        }).finally(() => {
            u2("loadings", "catalog", "juegos", false);
        });
    }

    const getCategorias = () => {
        if (s.loadings?.catalog?.categorias) return;
        u2("loadings", "catalog", "categorias", true);
        miAxios.get("catalog/categorias")
        .then(res => {
            u1("catalog", "categorias", res.data.categorias);
        })
        .catch(err => {
            console.log(err);
        }).finally(() => {
            u2("loadings", "catalog", "categorias", false);
        });
    }

    const createJuego = (data, callback) => {
        if (s.loadings?.catalog?.createJuego) return;
        u2("loadings", "catalog", "createJuego", true);
        miAxios.post("catalog/juegos", data)
        .then(res => {
            general.notificacion({
                message: "Juego creado correctamente",
                title: "Éxito",
                mode: "success"
            });
            getJuegos();
            if (callback) callback(res.data);
        })
        .catch(err => {
            const message = err?.response?.data?.detail || "Error al crear juego";
            general.notificacion({ message, title: "Error", mode: "danger" });
        }).finally(() => {
            u2("loadings", "catalog", "createJuego", false);
        });
    }

    const updateJuego = (data, callback) => {
        if (s.loadings?.catalog?.updateJuego) return;
        u2("loadings", "catalog", "updateJuego", true);
        miAxios.put("catalog/juegos", data)
        .then(res => {
            general.notificacion({
                message: "Juego actualizado correctamente",
                title: "Éxito",
                mode: "success"
            });
            getJuegos();
            if (callback) callback(res.data);
        })
        .catch(err => {
            const message = err?.response?.data?.detail || "Error al actualizar juego";
            general.notificacion({ message, title: "Error", mode: "danger" });
        }).finally(() => {
            u2("loadings", "catalog", "updateJuego", false);
        });
    }

    const deleteJuego = (juego_id, callback) => {
        if (s.loadings?.catalog?.deleteJuego) return;
        u2("loadings", "catalog", "deleteJuego", true);
        miAxios.delete("catalog/juegos", { data: { juego_id } })
        .then(res => {
            general.notificacion({
                message: "Juego eliminado correctamente",
                title: "Éxito",
                mode: "success"
            });
            getJuegos();
            if (callback) callback(res.data);
        })
        .catch(err => {
            const message = err?.response?.data?.detail || "Error al eliminar juego";
            general.notificacion({ message, title: "Error", mode: "danger" });
        }).finally(() => {
            u2("loadings", "catalog", "deleteJuego", false);
        });
    }

    const createCategoria = (data, callback) => {
        if (s.loadings?.catalog?.createCategoria) return;
        u2("loadings", "catalog", "createCategoria", true);
        miAxios.post("catalog/categorias", data)
        .then(res => {
            general.notificacion({
                message: "Categoría creada correctamente",
                title: "Éxito",
                mode: "success"
            });
            getCategorias();
            if (callback) callback(res.data);
        })
        .catch(err => {
            const message = err?.response?.data?.detail || "Error al crear categoría";
            general.notificacion({ message, title: "Error", mode: "danger" });
        }).finally(() => {
            u2("loadings", "catalog", "createCategoria", false);
        });
    }

    const updateCategoria = (data, callback) => {
        if (s.loadings?.catalog?.updateCategoria) return;
        u2("loadings", "catalog", "updateCategoria", true);
        miAxios.put("catalog/categorias", data)
        .then(res => {
            general.notificacion({
                message: "Categoría actualizada correctamente",
                title: "Éxito",
                mode: "success"
            });
            getCategorias();
            if (callback) callback(res.data);
        })
        .catch(err => {
            const message = err?.response?.data?.detail || "Error al actualizar categoría";
            general.notificacion({ message, title: "Error", mode: "danger" });
        }).finally(() => {
            u2("loadings", "catalog", "updateCategoria", false);
        });
    }

    const deleteCategoria = (categoria_id, callback) => {
        if (s.loadings?.catalog?.deleteCategoria) return;
        u2("loadings", "catalog", "deleteCategoria", true);
        miAxios.delete("catalog/categorias", { data: { categoria_id } })
        .then(res => {
            general.notificacion({
                message: "Categoría eliminada correctamente",
                title: "Éxito",
                mode: "success"
            });
            getCategorias();
            if (callback) callback(res.data);
        })
        .catch(err => {
            const message = err?.response?.data?.detail || "Error al eliminar categoría";
            general.notificacion({ message, title: "Error", mode: "danger" });
        }).finally(() => {
            u2("loadings", "catalog", "deleteCategoria", false);
        });
    }

    const uploadImage = (juego_id, file, imageData, callback) => {
        if (s.loadings?.catalog?.uploadImage) return;
        u2("loadings", "catalog", "uploadImage", true);

        const formData = new FormData();
        formData.append('file', file);

        miAxios.post(`catalog/upload_image/${juego_id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then(res => {
            // Register in DB
            miAxios.post("catalog/imagenes", {
                juego_id,
                nombre: file.name,
                ...imageData
            }).then(() => {
                general.notificacion({
                    message: "Imagen subida correctamente",
                    title: "Éxito",
                    mode: "success"
                });
                getJuegos();
                if (callback) callback(res.data);
            });
        })
        .catch(err => {
            const message = err?.response?.data?.detail || "Error al subir imagen";
            general.notificacion({ message, title: "Error", mode: "danger" });
        }).finally(() => {
            u2("loadings", "catalog", "uploadImage", false);
        });
    }

    const deleteImagen = (imagen_id, callback) => {
        if (s.loadings?.catalog?.deleteImagen) return;
        u2("loadings", "catalog", "deleteImagen", true);
        miAxios.delete("catalog/imagenes", { data: { imagen_id } })
        .then(res => {
            general.notificacion({
                message: "Imagen eliminada correctamente",
                title: "Éxito",
                mode: "success"
            });
            getJuegos();
            if (callback) callback(res.data);
        })
        .catch(err => {
            const message = err?.response?.data?.detail || "Error al eliminar imagen";
            general.notificacion({ message, title: "Error", mode: "danger" });
        }).finally(() => {
            u2("loadings", "catalog", "deleteImagen", false);
        });
    }

    const toggleFavorito = (juego_id, callback) => {
        if (s.loadings?.catalog?.toggleFavorito) return;
        u2("loadings", "catalog", "toggleFavorito", true);
        miAxios.post("catalog/favoritos", { juego_id })
        .then(res => {
            getJuegos();
            if (callback) callback(res.data);
        })
        .catch(err => {
            console.log(err);
        }).finally(() => {
            u2("loadings", "catalog", "toggleFavorito", false);
        });
    }

    return {
        getJuegos, getCategorias,
        createJuego, updateJuego, deleteJuego,
        createCategoria, updateCategoria, deleteCategoria,
        uploadImage, deleteImagen, toggleFavorito
    }
}
