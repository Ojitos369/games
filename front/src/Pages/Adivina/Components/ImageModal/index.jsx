import React from 'react';
import style from './styles/index.module.scss';

export const ImageModal = ({ show, onClose, image, title, description, tags, children }) => {
    if (!show) return null;

    return (
        <div className={style.overlay} onClick={onClose}>
            <div className={style.modal} onClick={e => e.stopPropagation()}>
                <button className={style.closeBtn} onClick={onClose}>✕</button>
                <div className={style.content}>
                    <div className={style.imageContainer}>
                        {image ? (
                            <img src={image} alt={title} className={style.fullImage} />
                        ) : (
                            <div className={style.placeholder}>🎭</div>
                        )}
                    </div>
                    <div className={style.info}>
                        <h2 className={style.title}>{title || 'Sin nombre'}</h2>
                        {description && <p className={style.description}>{description}</p>}
                        {tags && tags.length > 0 && (
                            <div className={style.tags}>
                                {tags.map(t => (
                                    <span key={t.id || t} className={style.tag}>{t.nombre || t}</span>
                                ))}
                            </div>
                        )}
                        <div className={style.actions}>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
