import { useEffect, useMemo } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { cambiarThema } from '../Core/helper';
import { Theme } from '../Components/Theme';

import { Main as MainPage } from '../Pages/Main';
import { Index as IndexPage } from '../Pages/Index';
import { Test as TestPage } from '../Pages/Test';
import { Chat as ChatPage } from '../Pages/Chat';
import { RushCar as RushCarPage } from '../Pages/Solo/RushCar';
import { Library as LibraryPage } from '../Pages/Library';
import { CatalogAdmin as CatalogAdminPage } from '../Pages/CatalogAdmin';

import { Login as LoginPage } from '../Pages/Login';
import { P404 } from '../Pages/P404';

import { store } from './store';
import { Provider } from "react-redux";
import { useStates } from '../Hooks/useStates';

import { GeneralNotification } from '../Components/Modals/general/GeneralNotification'; 


function AppUI() {
    const { ls, s, f } = useStates();
    const logged = useMemo(() => s.auth?.logged, [s.auth?.logged]);
    const isAdmin = useMemo(() => s.usuario?.data?.is_admin, [s.usuario?.data?.is_admin]);
    const validateDone = useMemo(() => s.loadings?.auth?.validateLogin === false, [s.loadings?.auth?.validateLogin]);

    useEffect(() => {
        cambiarThema(ls?.theme);
    }, [ls?.theme]);

    useEffect(() => {
        f.app.getModes();
    }, []);

    useEffect(() => {
        f.auth.validateLogin();
    }, [location.href]);

    // Show login if not logged in (mandatory)
    if (!logged) {
        return (
            <div className={`text-[var(--my-minor)] bg-my-${ls.theme}`}>
                <LoginPage />
                {!!s.modals?.general?.notification &&
                <GeneralNotification />}
            </div>
        );
    }

    return (
        <div className={`text-[var(--my-minor)] bg-my-${ls.theme}`}>
            <Routes>
                <Route path="" element={ <MainPage /> } >
                    <Route path="" element={ <LibraryPage /> } />
                    <Route path="chat/*" element={ <ChatPage /> } />
                    <Route path="test/*" element={ <TestPage /> } />
                    {isAdmin && (
                        <Route path="admin/*" element={ <CatalogAdminPage /> } />
                    )}
                    <Route path="*" element={ <P404 /> } />
                    {/* -----------   /404   ----------- */}
                </Route>
                <Route path="rushcar/*" element={ <RushCarPage /> } />
            </Routes>

            {!!s.modals?.general?.notification &&
            <GeneralNotification />}
        </div>
    );
}

function App(props) {
    return (
        <Provider store={store}>
            <AppUI />
        </Provider>
    );
}

export default App;
