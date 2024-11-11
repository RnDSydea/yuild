import React, { useState, useEffect } from 'react';
import './drawer.css';

const Drawer = ({ theme = 'sap', isOpen, onClose, children, closeBtn }) => {
  const [visible, setVisible] = useState(isOpen);

  useEffect(() => {
    setVisible(isOpen);
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains(`${theme}-drawer-overlay`)) {
      onClose();
    }
  };

  const drawerClass = `${theme}-drawer ${visible ? 'slide-in' : 'slide-out'}`;
  const overlayClass = `${theme}-drawer-overlay ${visible ? 'visible' : 'hidden'}`;

  return (
    <div className={overlayClass} onClick={handleOverlayClick}>
      <div className={drawerClass}>
        {closeBtn && (
            <div className={`${theme}-drawer-header`}>
                <button className={`${theme}-drawer-close`} onClick={onClose}>
                    &times;
                </button>
            </div>
        )}
        <div className={`${theme}-drawer-content`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Drawer;
