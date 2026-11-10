import React, { useState } from 'react';
import Alert from '../alert/alert';
import Button from '../button/button';

const AlertTrigger = ({
  theme = 'sap',
  buttonLabel = 'Show alert',
  title = 'Alert',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button label={buttonLabel} theme={theme} onClick={() => setIsOpen(true)} />
      {isOpen && (
        <Alert
          theme={theme}
          showAlert
          header={<h2>{title}</h2>}
          body={<div>{message}</div>}
          labelBtnConfirm={confirmLabel}
          labelBtnCancel={cancelLabel}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default AlertTrigger;
