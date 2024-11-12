import React, {useState} from 'react';
import './toast.scss';
import xmark from '../../assets/xmark-solid.svg';
import success from '../../assets/check-solid.svg';
import warning from '../../assets/triangle-exclamation-solid.svg';
import info from '../../assets/info-solid.svg';

const Toast = ({ message, variant = 'default', theme = 'sap', position = '' }) => {
  const [isVisible, setIsVisible] = useState(true);
  const toastClass = `${theme}-toast ${theme}-toast-${variant} ${theme}-toast-${position}`;
  const iconContainerClass = `${theme}-iconContainer-${variant}`;

  const getIconSrc = () => {
    switch (variant) {
      case 'success':
        return success;
      case 'warning':
        return warning;
      case 'information':
        return info;
      case 'error':
      case 'default':
      default:
        return xmark;
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <div className={`${toastClass} ${isVisible ? '' : 'fade-out'}`}
      style={{ display: isVisible ? 'flex' : 'none', width: "20rem" }}>
      {variant !=='default' &&
        <div className={iconContainerClass}>
          <img className={`${theme}-icon-${variant}`} src={getIconSrc()} alt={`${variant} icon`} />
        </div>
      }
      {message}
      <div>
        <img className={` ${theme}-closeBtn ${theme}-closeBtn-${variant}`} src={xmark} alt='close button' onClick={handleClose}/>
      </div>
    </div>
  );
};

export default Toast;
