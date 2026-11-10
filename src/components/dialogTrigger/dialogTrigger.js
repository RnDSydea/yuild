import React, { useState } from 'react';
import Button from '../button/button';
import Dialog from '../dialog/dialog';
import YuildHeader from '../yUildHeader/yUildHeader';
import YuildBody from '../yUildBody/yUildBody';
import YuildFooter from '../yUildFooter/yUildFooter';

const DialogTrigger = ({ theme = 'sap', buttonLabel = 'Open dialog', title = 'Dialog', content = '', closeLabel = 'Close' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);
  return (
    <>
      <Button label={buttonLabel} theme={theme} onClick={() => setIsOpen(true)} />
      {isOpen && (
        <Dialog theme={theme} onClose={close}>
          <YuildHeader>
            <h2>{title}</h2>
          </YuildHeader>
          <YuildBody>
            <p>{content}</p>
          </YuildBody>
          <YuildFooter>
            <Button label={closeLabel} theme={theme} variant="tertiary" onClick={close} />
          </YuildFooter>
        </Dialog>
      )}
    </>
  );
};

export default DialogTrigger;
