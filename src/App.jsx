import { Suspense, useState } from 'react';

const suspensePromises = {};
function ComponentThatSuspendsOnlyOnDuringSSR({ children, timeoutMs, suspenseId: id }) {
  if (!(id in suspensePromises)) {
    suspensePromises[id] = { suspensePromiseResolved: false };
  }
  if (!suspensePromises[id].suspensePromiseResolved && import.meta.env.SSR) {
    if (!suspensePromises[id].suspensePromise) {
      suspensePromises[id].suspensePromise = new Promise((resolve) => {
        setTimeout(() => {
          suspensePromises[id].suspensePromiseResolved = true;
          suspensePromises[id].suspensePromise = null;
          resolve();
        }, timeoutMs);
      });
    }
    throw suspensePromises[id].suspensePromise;
  }
  return <>{children}</>;
}

function FallbackButton({ onClick }) {
  console.log('Running FallbackButton...');
  return <button onClick={onClick}>Fallback Button</button>;
}

function ResolvedButton({ onClick }) {
  console.log('Running ResolvedButton...');
  return <button onClick={onClick}>Resolved Button</button>;
}

function App({ suspenseId }) {
  const [didClick, setDidClick] = useState(false);
  const handleClick = () => {
    console.log('clicked');
    setDidClick(!didClick);
  };
  return (
    <>
      <h1>React SSR Bug Repro</h1>
      <div>
        Clicking either the fallback or resolved buttons should toggle "Button
        was
        <br />
        clicked!" below. Clicking on the "Suspense sibling" will cancel
        hydration and
        <br />
        client render everything.
      </div>
      <br />
      <div style={{borderColor: 'red', borderStyle:'solid'}} onClick={handleClick}>
        <button onClick={handleClick}>Suspense sibling</button>
        <br />
        <br />
        <Suspense fallback={<FallbackButton onClick={handleClick} />}>
          <ComponentThatSuspendsOnlyOnDuringSSR suspenseId={suspenseId} timeoutMs={3000}>
            <ResolvedButton onClick={handleClick} />
          </ComponentThatSuspendsOnlyOnDuringSSR>
        </Suspense>
        {didClick && <div>Button was clicked!</div>}
      </div>
    </>
  );
}

export default App;
