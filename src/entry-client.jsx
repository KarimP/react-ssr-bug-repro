import { hydrateRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App.jsx';

hydrateRoot(
  document.getElementById('root'),
    <App
      suspenseId={document.getElementById('suspenseId').dataset.suspenseId}
    />
);

window.onerror = function onerror(event, source, lineno, colno, error) {
  let pre = document.createElement('pre');
  pre.style.color = 'red';
  pre.innerHTML = `============\nON ERROR\n${error.message}\n${error.stack}`;
  document.body.appendChild(pre);
};
