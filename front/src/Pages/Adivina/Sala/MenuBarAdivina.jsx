import React, { useRef, useEffect } from 'react';
import { useStates } from '../../../Hooks/useStates';
import style from './styles/index.module.scss';

export const MenuBarAdivinaSala = () => {
    const { s } = useStates();
    const props = s.adivina?.salaProps;
    const actions = window.adivinaActions;

    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [props?.chatMessages]);

    if (!props || !actions) return null;

    const { chatMessages, chatInput, userId } = props;
    const { setChatInput, sendChat } = actions;

    return (
        <div className={`${style.chatPanel} ${style.chatPanelInBar}`} style={{ height: '100%' }}>
            <h3 className={`${style.panelTitle}`}>Chat</h3>
            <div className={`${style.chatMessages}`}>
                {chatMessages.map((msg, i) => (
                    <div key={i} className={`${style.chatMsg} ${msg.system ? style.chatSystem : (msg.user_id === userId ? style.chatMe : style.chatOther)} ${msg.mode === 'success' ? style.historialSuccess : (msg.mode === 'danger' ? style.historialDanger : '')}`}>
                        {!msg.system && <span className={`${style.chatFrom}`}>{msg.username}:</span>}
                        <span className={`${style.chatText}`}>{msg.text}</span>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); sendChat(); }} className={`${style.chatForm}`}>
                <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className={`${style.input} ${style.chatInput}`}
                />
                <button type="submit" className={`${style.btnPrimary} ${style.btnSendChat}`}>➤</button>
            </form>
        </div>
    );
};
