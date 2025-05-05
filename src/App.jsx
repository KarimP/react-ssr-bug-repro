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

function useInitiallyClientRendered() {
  const [emptySubscribe] = useState(() => () => {});
  const isClientRendering = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [initiallyClientRendered] = useState(isClientRendering);
  return initiallyClientRendered;
}

function HighlightInitialRenderingEnvironment({ children }) {
  const initiallyClientRendered = useInitiallyClientRendered();
  return (
    <div
      style={{
        backgroundColor: initiallyClientRendered
          ? 'lightcoral'
          : 'darkseagreen',
      }}
    >
      {children}
    </div>
  );
}

function InitialRenderingEnvironment() {
  const initiallyClientRendered = useInitiallyClientRendered();
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
  return (
    <>
      <div>
        <b>This context value will change during hydration:</b>
      </div>
      <div>
        Context value:{' '}
        <span
          style={{
            backgroundColor: value === 'InitialValue' ? 'parent' : 'yellow',
          }}
        >
          {value}
        </span>
      </div>
    </>
  );
}

function App({ suspenseId }) {
  const [value, setValue] = useState('InitialValue');
  useEffect(() => {
    setTimeout(() => setValue('NewValue'), 2000);
  }, [setValue]);
  return (
    <AppContext.Provider value={value}>
      <h1>React SSR Bug Repro</h1>
      <div>Green = Component was initially rendered on the server</div>
      <div>Red = Component was initially rendered on the client</div>
      <HighlightInitialRenderingEnvironment>
        <AppContextValue />
      </HighlightInitialRenderingEnvironment>
      <br />
      <HighlightInitialRenderingEnvironment>
        <InitialRenderingEnvironment />
      </HighlightInitialRenderingEnvironment>
      <br />
      <HighlightInitialRenderingEnvironment>
        <div>
          The suspense boundary below will always resolve to the client-rendered
          component
          <br />
          due to a context update forcing a higher priorty sync update, which
          cancels any
          <br />
          pending un-hydrated boundaries. This will result in any server
          rendered markup
          <br />
          that eventually comes in after the sync update to be thrown away.
          Getting rid of
          <br />
          the context change that happens in the <code>useEffect</code> hook in
          the <code>{'<App />'}</code> component
          <br />
          will result in the server rendered markup showing up instead.
        </div>
      </HighlightInitialRenderingEnvironment>
      <br />
      <Suspense
        fallback={
          <HighlightInitialRenderingEnvironment>
            <div>
              Suspense fallack, this should get replaced with an SSR-ed
              component first
            </div>
          </HighlightInitialRenderingEnvironment>
        }
      >
        <ComponentThatSuspends suspenseId={suspenseId} timeoutMs={3000}>
          <HighlightInitialRenderingEnvironment>
            <InitialRenderingEnvironment />
          </HighlightInitialRenderingEnvironment>
        </ComponentThatSuspends>
      </Suspense>
    </AppContext.Provider>
  );
}

export default App;
