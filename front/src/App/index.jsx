import { useEffect, useMemo, useRef } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { cambiarThema } from '../Core/helper';
import { Theme } from '../Components/Theme';

import { Main as MainPage } from '../Pages/Main';
import { Index as IndexPage } from '../Pages/Index';
import { Test as TestPage } from '../Pages/Test';
import { Chat as ChatPage } from '../Pages/Chat';
import { RushCar as RushCarPage } from '../Pages/Solo/RushCar';
import { Library as LibraryPage } from '../Pages/Library';
import { GameDetail as GameDetailPage } from '../Pages/GameDetail';
import { CatalogAdmin as CatalogAdminPage } from '../Pages/CatalogAdmin';
import { Adivina as AdivinaPage } from '../Pages/Adivina';
import { AdivinaSala as AdivinaSalaPage } from '../Pages/Adivina/Sala';

import { Login as LoginPage } from '../Pages/Login';
import { P404 } from '../Pages/P404';

import { store } from './store';
import { Provider } from "react-redux";
import { useStates } from '../Hooks/useStates';

import { GeneralNotification } from '../Components/Modals/general/GeneralNotification'; 


function AppUI() {
    const { ls, s, f } = useStates();
    const location = useLocation();
    const logged = useMemo(() => s.auth?.logged, [s.auth?.logged]);
    const isAdmin = useMemo(() => s.usuario?.data?.is_admin, [s.usuario?.data?.is_admin]);
    const validateDone = useMemo(() => s.loadings?.auth?.validateLogin === false, [s.loadings?.auth?.validateLogin]);
    const validatedRef = useRef(false);

    useEffect(() => {
        cambiarThema(ls?.theme);
    }, [ls?.theme]);

    useEffect(() => {
        f.app.getModes();
    }, []);

    useEffect(() => {
        if (!validatedRef.current || s.auth?.logged) {
            validatedRef.current = true;
            f.auth.validateLogin();
        }
    }, [location.pathname]);

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
                    <Route path="game/:id" element={ <GameDetailPage /> } />
                    <Route path="chat/*" element={ <ChatPage /> } />
                    <Route path="test/*" element={ <TestPage /> } />
                    {isAdmin && (
                        <Route path="admin/*" element={ <CatalogAdminPage /> } />
                    )}
                    <Route path="adivina/*" element={ <AdivinaPage /> } />
                    <Route path="adivina/sala/:codigo" element={ <AdivinaSalaPage /> } />
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
