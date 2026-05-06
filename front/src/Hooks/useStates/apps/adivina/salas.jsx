export const salas = props => {
    const { miAxios, s, u1, u2, general } = props;

    const listar = () => {
        if (s.loadings?.adivina?.salas) return;
        u2('loadings', 'adivina', 'salas', true);
        miAxios.get('games/adivina/salas')
            .then(res => u1('adivina', 'salas', res.data.salas))
            .catch(err => console.log(err))
            .finally(() => u2('loadings', 'adivina', 'salas', false));
    };

    const crear = (data, cb) => {
        if (s.loadings?.adivina?.crearSala) return;
        u2('loadings', 'adivina', 'crearSala', true);
        miAxios.post('games/adivina/salas', data)
            .then(res => {
                listar();
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al crear sala';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'crearSala', false));
    };

    const obtener = (codigo, cb) => {
        miAxios.get(`games/adivina/salas/info?codigo=${codigo}`)
            .then(res => cb?.(res.data.sala))
            .catch(err => console.log(err));
    };

    const reaperturar = (codigo, cb) => {
        if (s.loadings?.adivina?.reaperturarSala) return;
        u2('loadings', 'adivina', 'reaperturarSala', true);
        miAxios.post('games/adivina/salas/reaperturar', { codigo })
            .then(res => {
                general.notificacion({ message: 'Sala reaperturada con éxito', title: 'Éxito', mode: 'success' });
                cb?.(res.data);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || 'Error al reaperturar sala';
                general.notificacion({ message, title: 'Error', mode: 'danger' });
            })
            .finally(() => u2('loadings', 'adivina', 'reaperturarSala', false));
    };

    return { listar, crear, obtener, reaperturar };
};
