import { hydrateRoot } from 'react-dom/client';
import App from './App.jsx';

hydrateRoot(
  document.getElementById('root'),
  <div><App /></div>,
);

window.onerror = function onerror(event, source, lineno, colno, error) {
  let pre = document.createElement('pre');
  pre.style.color = 'red';
  pre.innerHTML = `============\nON ERROR\n${error.message}\n${error.stack}`;
  document.body.appendChild(pre);
}