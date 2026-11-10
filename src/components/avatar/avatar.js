import React from 'react';
import './avatar.scss';

const getInitials = (initials) => String(initials ?? '').trim().slice(0, 2).toUpperCase();

const Avatar = ({ theme = 'sap', initials = 'AB', size = 'medium', label }) => (
  <span className={`${theme}-avatar ${theme}-avatar-${size}`} role="img" aria-label={label || getInitials(initials)}>
    {getInitials(initials)}
  </span>
);

export default Avatar;
