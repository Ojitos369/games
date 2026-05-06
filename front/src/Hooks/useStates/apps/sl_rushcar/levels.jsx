const base_link = 'games/rush_car';

export const levels = props => {
    const { miAxios, u2, records } = props;

    const obtener = (params = {}) => {
        const { id = null, optimo = null } = params;
        let url = `${base_link}/get_level`;
        const queryParams = [];
        if (id) queryParams.push(`id=${id}`);
        if (optimo) queryParams.push(`optimo=${optimo}`);
        if (queryParams.length > 0) url += `?${queryParams.join('&')}`;

        u2('solo', 'rushcar', 'loading', true);
        miAxios.get(url)
            .then(res => {
                const { nivel } = res.data;
                u2('solo', 'rushcar', 'level', nivel);
                u2('solo', 'rushcar', 'loading', false);
                records.listar({ level_id: nivel.id });
            })
            .catch(err => {
                console.log(err);
                u2('solo', 'rushcar', 'loading', false);
            });
    };

    return { obtener };
};
