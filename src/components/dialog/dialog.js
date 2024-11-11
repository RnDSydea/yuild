import React, {useState} from 'react';
import './dialog.css';
import xmark from '../../assets/xmark-solid.svg'
import { ThemeProvider } from './themeContext';

const Dialog = ({ theme = 'sap', children, onClose}) => {
    const overlayClass = `${theme}-overlay`  
    const dialogClass = `${theme}-dialog`;
    const dialogId = "dialog-container"

    const handleOverlayClick = (event) => {
        const dialogElement = document.getElementById(dialogId);
        if (dialogElement && !dialogElement.contains(event.target)) {
          onClose();
        }
    };

  return (
    <ThemeProvider theme={theme}>
        <div className={overlayClass} onClick={handleOverlayClick}>
            <div className={dialogClass} id={dialogId}>
                <div className='closeBtnContainer'>
                    <img className='closeBtn' src={xmark} alt='close button'  onClick={onClose} />
                </div>
                {children}
            </div>
        </div>    
    </ThemeProvider>
  );
};

export default Dialog;
