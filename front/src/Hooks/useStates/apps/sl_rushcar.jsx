const base_link = 'games/rush_car'
export const sl_rushcar = props => {
    const { miAxios, s, u1, u2, u3, urs } = props

    const getLevel = (params = {}) => {
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
            // Cargar records del nivel
            getRecords({ level_id: nivel.id });
        }).catch(err => {
            console.log(err);
            u2('solo', 'rushcar', 'loading', false);
        });
    }

    const saveRecord = (params = {}) => {
        const { username, level_id, moves, seconds } = params;
        miAxios.post(`${base_link}/save_record`, {
            username, level_id, moves, seconds
        })
        .then(res => {
            // Recargar records, top players y trending
            getRecords({ level_id });
            getTopPlayers();
            getTrending();
        }).catch(err => {
            console.log(err);
        });
    }

    const getRecords = (params = {}) => {
        const { level_id } = params;
        if (!level_id) return;
        miAxios.get(`${base_link}/get_records?level_id=${level_id}`)
        .then(res => {
            const { world } = res.data;
            u3('solo', 'rushcar', 'records', 'world', world);
        }).catch(err => {
            console.log(err);
        });
    }

    const getUserRecords = (params = {}) => {
        const { username } = params;
        if (!username) return;
        u2('solo', 'rushcar', 'loading', true);
        miAxios.get(`${base_link}/get_user_records?username=${encodeURIComponent(username)}`)
        .then(res => {
            const { records } = res.data;
            u3('solo', 'rushcar', 'userRecords', 'data', records);
            u3('solo', 'rushcar', 'userRecords', 'username', username);
            u2('solo', 'rushcar', 'loading', false);
        }).catch(err => {
            console.log(err);
            u2('solo', 'rushcar', 'loading', false);
        });
    }

    const getTopPlayers = () => {
        miAxios.get(`${base_link}/get_top_players`)
        .then(res => {
            const { players } = res.data;
            u3('solo', 'rushcar', 'records', 'topPlayers', players);
        }).catch(err => {
            console.log(err);
        });
    }

    const getTrending = () => {
        miAxios.get(`${base_link}/get_trending`)
        .then(res => {
            const { popular, recent } = res.data;
            u3('solo', 'rushcar', 'records', 'popular', popular);
            u3('solo', 'rushcar', 'records', 'recent', recent);
        }).catch(err => {
            console.log(err);
        });
    }

    return {
        getLevel,
        saveRecord,
        getRecords,
        getUserRecords,
        getTopPlayers,
        getTrending,
    }
}