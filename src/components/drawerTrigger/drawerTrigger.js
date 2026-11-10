import React, { useState } from 'react';
import Button from '../button/button';
import Drawer from '../drawer/drawer';

const DrawerTrigger = ({ theme = 'sap', buttonLabel = 'Open drawer', content = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button label={buttonLabel} theme={theme} onClick={() => setIsOpen(true)} />
      <Drawer theme={theme} isOpen={isOpen} onClose={() => setIsOpen(false)} closeBtn>
        <p>{content}</p>
      </Drawer>
    </>
  );
};

export default DrawerTrigger;
