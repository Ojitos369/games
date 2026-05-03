import { useState, useEffect, useRef, useMemo } from 'react';
import { useStates } from '../../Hooks/useStates';
import style from './styles/index.module.scss';

const myStates = () => {
    const { s, f } = useStates();
    const usuario = useMemo(() => s.auth?.form?.usuario ?? '', [s.auth?.form?.usuario]);
    const passwd = useMemo(() => s.auth?.form?.passwd ?? '', [s.auth?.form?.passwd]);
    const [isRegister, setIsRegister] = useState(false);

    const updateUsuario = (e) => {
        const value = e.target.value;
        f.u2("auth", "form", "usuario", value);
    }
    const updatePasswd = (e) => {
        const value = e.target.value;
        f.u2("auth", "form", "passwd", value);
    };

    const handleSubmit = e => {
        if (!!e) e.preventDefault();
        if (isRegister) {
            f.auth.register(usuario, passwd);
        } else {
            f.auth.login(usuario, passwd);
        }
    }

    return {
        usuario, passwd, updateUsuario, updatePasswd, handleSubmit, isRegister, setIsRegister
    }
}

export const Login = () => {
    const { usuario, passwd, updateUsuario, updatePasswd, handleSubmit, isRegister, setIsRegister } = myStates();
    return (
        <div className={`${style.loginPage}`}>
            <div className={`${style.loginContainer}`}>
                <div className={`${style.logoSection}`}>
                    <h1 className={`${style.brandName}`}>
                        GAMES<span className={`${style.brandDot}`}></span>
                    </h1>
                    <p className={`${style.brandSub}`}>Biblioteca de juegos</p>
                </div>
                <form className={`${style.formCard}`} onSubmit={handleSubmit}>
                    <h2 className={`${style.formTitle}`}>{isRegister ? 'Crear cuenta' : 'Bienvenido'}</h2>
                    <p className={`${style.formSubtitle}`}>
                        {isRegister ? 'Completa tus datos para registrarte' : 'Inicia sesión para continuar'}
                    </p>
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
                                required
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
                                autoComplete="new-password"
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className={`${style.submitBtn}`} id="login-submit">
                        {isRegister ? 'Registrarse' : 'Ingresar'}
                    </button>
                    <div className={`${style.toggleAuth}`}>
                        {isRegister ? (
                            <p>¿Ya tienes cuenta? <button type="button" onClick={() => setIsRegister(false)}>Inicia sesión</button></p>
                        ) : (
                            <p>¿No tienes cuenta? <button type="button" onClick={() => setIsRegister(true)}>Regístrate</button></p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
