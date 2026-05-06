export const general = props => {
    const { u1, u2 } = props;

    const notificacion = ({ message, title, mode = 'info', html, messages }) => {
        u1("general", "notification", { message, title, mode, html, messages });
        u2("modals", "general", "notification", true);
    };

    const cerrarNotificacion = () => {
        u2("modals", "general", "notification", false);
    };

    return { notificacion, cerrarNotificacion };
};
