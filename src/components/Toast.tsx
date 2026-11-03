import React from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from '../icons';

export const Toast: React.FC = () => {
  const { toastMessage } = useApp();
  if (!toastMessage) return null;

  return (
    <div className="toast" role="status">
      <Icon name="check" size={17} />
      <span>{toastMessage}</span>
    </div>
  );
};
