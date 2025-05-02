import {
  Suspense,
  createContext,
  useContext,
  useState,
  useEffect,
  useSyncExternalStore,
} from 'react';

const suspensePromises = {};
function ComponentThatSuspends({ children, timeoutMs, suspenseId: id }) {
  if (!(id in suspensePromises)) {
    suspensePromises[id] = { suspensePromiseResolved: false };
  }
  if (!suspensePromises[id].suspensePromiseResolved) {
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

function InitialRenderingState() {
  const [emptySubscribe] = useState(() => () => {});
  const isClientRendering = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [initiallyClientRendered] = useState(isClientRendering);
  return (
    <div>
      This component initially rendered on
      {initiallyClientRendered ? ' the client' : ' the server'}
    </div>
  );
}

const AppContext = createContext(null);

function AppContextValue() {
  const value = useContext(AppContext);
  return <div>Context value: {value}</div>;
}

function App({ suspenseId }) {
  const [value, setValue] = useState('InitialValue');
  useEffect(() => {
    setTimeout(() => setValue('NewValue'), 1000);
  }, [setValue]);
  return (
    <AppContext.Provider value={value}>
      <h1>React SSR Bug Repro</h1>
      <AppContextValue />
      <br />
      <InitialRenderingState />
      <br />
      <div>
        The suspense below will always resolve to the client component due to a
        context
        <br />
        update forcing a higher priorty sync and cancelling pending un-hydrated
        <br />
        boundaries. This will result in server rendered markup that eventually
        comes in
        <br />
        after the sync update to be thrown away. Getting rid of the context
        change that
        <br />
        happens in <code>useEffect</code> in the <code>{'<App />'}</code>{' '}
        component will result in the server rendered
        <br />
        markup showing up instead.
      </div>
      <br />
      <Suspense
        fallback={
          <div>
            Suspense fallack, this should get replaced with an SSR-ed component
            first
          </div>
        }
      >
        <ComponentThatSuspends suspenseId={suspenseId} timeoutMs={2000}>
          <InitialRenderingState />
        </ComponentThatSuspends>
      </Suspense>
    </AppContext.Provider>
  );
}

export default App;
