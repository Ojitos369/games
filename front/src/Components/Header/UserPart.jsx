import { localStates } from "./localStates";

export const UserPart = () => {
    const { openUserMenu, style, IconMenu, showIconMenu, username, closeSession } = localStates();
    return (
        <div className={`${style.userPart}`}>
            {username && (
                <span style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.8rem',
                    marginRight: '0.8rem'
                }}>{username}</span>
            )}
            <button
                onClick={closeSession}
                style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.6)',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    marginRight: showIconMenu ? '0.5rem' : '0',
                }}
            >
                Salir
            </button>
            {showIconMenu && <IconMenu className="manita" onClick={openUserMenu} />}
        </div>
    )
}