export const app = props => {
    const { miAxios, u1, u2 } = props;

    const ping = () => miAxios.get('base/hh').then(r => {
        u2("app", "hh", "response", r.data);
        return r.data;
    });

    const getModes = () => {
        miAxios.get('base/get_modes')
            .then(res => u1("app", "modes", res.data))
            .catch(() => {});
    };

    return { ping, getModes };
};
