import React, { useState } from 'react';
import Button from '../button/button';
import './alert.scss';

const Alert = ({ header, body, labelBtnConfirm ='', labelBtnCancel= '',  theme = 'sap', variant="default", showAlert, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const alertId = 'alert-container';

  const handleClose = (actionType) => {
    setIsVisible(false);
    if (onClose) {
      onClose(actionType);
    }
  };

  const handleOverlayClick = (event) => {
    const alertElement = document.getElementById(alertId);
    if (alertElement && !alertElement.contains(event.target)) {
      handleClose('click-outside');
    }
  };

  const themeClass = `${theme}`
  const overlayClass = `${theme}-overlay`
  const alertClass = `${theme}-alert ${isVisible ? 'fade-in' : 'fade-out'}`;
  const headerClass = `${theme}-alert-header`;
  const bodyClass = `${theme}-alert-body`;
  const footerClass = `${theme}-alert-footer`;

  return (
    <>
      {showAlert && (
        <div className={overlayClass} onClick={handleOverlayClick}>
          <div className={alertClass} id={alertId}>
            {header && <div className={headerClass}>{header}</div>}
            {body && <div className={bodyClass}>{body}</div>}
            {(labelBtnConfirm || labelBtnCancel) && (
              <div className={footerClass}>
              {labelBtnConfirm && (
                  <Button label= {labelBtnConfirm}   onClick={() => handleClose('confirm')} theme={themeClass}/>
                    
                )}
                {labelBtnCancel && (
                  <Button label={labelBtnCancel}   onClick={() => handleClose('cancel')} variant="tertiary" theme= {themeClass}/>
                )}
              </div> 
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Alert;
