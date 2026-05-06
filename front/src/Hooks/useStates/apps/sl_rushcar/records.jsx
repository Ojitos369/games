const base_link = 'games/rush_car';

export const records = props => {
    const { miAxios, u2, u3 } = props;

    const listar = (params = {}) => {
        const { level_id } = params;
        if (!level_id) return;
        miAxios.get(`${base_link}/get_records?level_id=${level_id}`)
            .then(res => {
                const { world } = res.data;
                u3('solo', 'rushcar', 'records', 'world', world);
            })
            .catch(err => console.log(err));
    };

    const guardar = (params = {}) => {
        const { username, level_id, moves, seconds } = params;
        miAxios.post(`${base_link}/save_record`, { username, level_id, moves, seconds })
            .then(() => {
                listar({ level_id });
                topPlayers();
                trending();
            })
            .catch(err => console.log(err));
    };

    const listarUsuario = (params = {}) => {
        const { username } = params;
        if (!username) return;
        u2('solo', 'rushcar', 'loading', true);
        miAxios.get(`${base_link}/get_user_records?username=${encodeURIComponent(username)}`)
            .then(res => {
                const { records: data } = res.data;
                u3('solo', 'rushcar', 'userRecords', 'data', data);
                u3('solo', 'rushcar', 'userRecords', 'username', username);
                u2('solo', 'rushcar', 'loading', false);
            })
            .catch(err => {
                console.log(err);
                u2('solo', 'rushcar', 'loading', false);
            });
    };

    const topPlayers = () => {
        miAxios.get(`${base_link}/get_top_players`)
            .then(res => u3('solo', 'rushcar', 'records', 'topPlayers', res.data.players))
            .catch(err => console.log(err));
    };

    const trending = () => {
        miAxios.get(`${base_link}/get_trending`)
            .then(res => {
                const { popular, recent } = res.data;
                u3('solo', 'rushcar', 'records', 'popular', popular);
                u3('solo', 'rushcar', 'records', 'recent', recent);
            })
            .catch(err => console.log(err));
    };

    return { listar, guardar, listarUsuario, topPlayers, trending };
};
