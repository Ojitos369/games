export const auth = props => {
    const { miAxios, pjid, s, u1, u2, urs, general } = props;

    const setCookie = (token, hours = 12) => {
        const date = new Date();
        date.setTime(date.getTime() + 1000 * 60 * 60 * hours);
        document.cookie = `${pjid}=${token};expires=${date.toUTCString()};path=/;SameSite=Lax`;
    };
    const clearCookie = () => {
        document.cookie = `${pjid}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
    };

    const login = (usuario, passwd) => {
        if (s.loadings?.auth?.login) return;
        u2("loadings", "auth", "login", true);
        miAxios.post('auth/login', { usuario, passwd })
            .then(res => {
                const { user, token } = res.data;
                u2("auth", "form", "usuario", "");
                u2("auth", "form", "passwd", "");
                u1("auth", "logged", true);
                u1("usuario", "data", user);
                setCookie(token);
            })
            .catch(err => {
                const message = err?.response?.data?.detail || "Error al iniciar sesion";
                general.notificacion({ message, title: "Error", mode: "danger" });
                u1("auth", "logged", false);
            })
            .finally(() => u2("loadings", "auth", "login", false));
    };

    const register = (usuario, passwd) => {
        if (s.loadings?.auth?.register) return;
        u2("loadings", "auth", "register", true);
        miAxios.post('auth/register', { usuario, passwd })
            .then(res => {
                const { user, token } = res.data;
                u2("auth", "form", "usuario", "");
                u2("auth", "form", "passwd", "");
                u1("auth", "logged", true);
                u1("usuario", "data", user);
                setCookie(token);
                general.notificacion({
                    message: "¡Bienvenido! Tu cuenta ha sido creada.",
                    title: "Registro exitoso",
                    mode: "success",
                });
            })
            .catch(err => {
                const message = err?.response?.data?.detail || "Error";
                general.notificacion({ message, title: "Error", mode: "danger" });
            })
            .finally(() => u2("loadings", "auth", "register", false));
    };

    const validateLogin = () => {
        if (s.loadings?.auth?.validateLogin) return;
        u2("loadings", "auth", "validateLogin", true);
        miAxios.get('auth/validate_login')
            .then(res => {
                const { user, token } = res.data;
                setCookie(token, 5);
                u1("auth", "logged", true);
                u1("usuario", "data", user);
            })
            .catch(() => {
                urs();
                clearCookie();
            })
            .finally(() => u2("loadings", "auth", "validateLogin", false));
    };

    const closeSession = () => {
        if (s.auth?.logged) {
            miAxios.get('auth/close_session').catch(() => {});
        }
        urs();
        clearCookie();
    };

    return { login, register, validateLogin, closeSession };
};
