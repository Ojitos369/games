import { useMemo, useEffect } from "react";
import { useStates, createState } from "../../Hooks/useStates";
import style from './styles/index.module.scss';

import { MenuBarDefault } from "../../Pages/Index/MenuBarDefault";

export const localStates = () => {
    const { s } = useStates();
    // const menubarOpen = useMemo(() => s.menubar?.open, [s.menubar?.open]);
    const [menubarOpen, setMenuBarOpen] = createState(['menubar', 'open'], false);
    const menuMode = useMemo(() => s.menubar?.menuMode, [s.menubar?.menuMode]);
    const Component = useMemo(() => {
        switch (menuMode) {
            case 'menuBarDefault':
                return MenuBarDefault;
            default:
                return null;
        }
    }, [menuMode]);

    return {
        style, Component,
        menubarOpen, setMenuBarOpen,
    }
}

export const localEffects = () => {
    const { Component, setMenuBarOpen } = localStates();

    useEffect(() => {
        if (!Component) {
            setMenuBarOpen(false);
        }
    }, [Component]);
}