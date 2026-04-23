import { useState, useEffect, useRef, useMemo } from 'react';
import { useStates } from '../../Hooks/useStates';
import style from './styles/index.module.scss';

const myStates = () => {
    const { s, f } = useStates();
    const usuario = useMemo(() => s.auth?.form?.usuario ?? '', [s.auth?.form?.usuario]);
    const passwd = useMemo(() => s.auth?.form?.passwd ?? '', [s.auth?.form?.passwd]);

    const updateUsuario = (e) => {
        const value = e.target.value;
        f.u2("auth", "form", "usuario", value);
    }
    const updatePasswd = (e) => {
        const value = e.target.value;
        f.u2("auth", "form", "passwd", value);
    };

    const login = e => {
        if (!!e) e.preventDefault();
        f.auth.login(usuario, passwd);
    }

    return {
        usuario, passwd, updateUsuario, updatePasswd, login
    }
}

export const Login = () => {
    const { usuario, passwd, updateUsuario, updatePasswd, login } = myStates();
    return (
        <div className={`${style.loginPage}`}>
            <div className={`${style.loginContainer}`}>
                <div className={`${style.logoSection}`}>
                    <h1 className={`${style.brandName}`}>
                        VAULT<span className={`${style.brandDot}`}></span>
                    </h1>
                    <p className={`${style.brandSub}`}>Biblioteca de juegos</p>
                </div>
                <form className={`${style.formCard}`} onSubmit={login}>
                    <h2 className={`${style.formTitle}`}>Bienvenido</h2>
                    <p className={`${style.formSubtitle}`}>Inicia sesión para continuar</p>
                    <div className={`${style.inputGroup}`}>
                        <label>Usuario</label>
                        <div className={`${style.inputWrapper}`}>
                            <span className={`${style.inputIcon}`}>👤</span>
                            <input
                                id="login-usuario"
                                type="text"
                                placeholder='Tu nombre de usuario'
                                value={usuario}
                                onChange={updateUsuario}
                                autoComplete="username"
                            />
                        </div>
                    </div>
                    <div className={`${style.inputGroup}`}>
                        <label>Contraseña</label>
                        <div className={`${style.inputWrapper}`}>
                            <span className={`${style.inputIcon}`}>🔒</span>
                            <input
                                id="login-password"
                                type="password"
                                placeholder='Tu contraseña'
                                value={passwd}
                                onChange={updatePasswd}
                                autoComplete="current-password"
                            />
                        </div>
                    </div>
                    <button type="submit" className={`${style.submitBtn}`} id="login-submit">
                        Ingresar
                    </button>
                </form>
            </div>
        </div>
    );
};
