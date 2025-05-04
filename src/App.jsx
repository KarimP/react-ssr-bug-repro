import { Suspense } from 'react';

const suspensePromises = {};
function ComponentThatSuspends({timeoutMs, suspenseId: id}) {
  if (!(id in suspensePromises)) {
    suspensePromises[id] = {suspensePromiseResolved: false};
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
  return <div>Resolved</div>;
}

function FallbackWithSuspends({suspenseId}) {
  return <div>
    This is a suspense fallback that has nested suspends
    <Suspense fallback={<div>Nested suspense fallback</div>}>
      <ComponentThatSuspends suspenseId={suspenseId} timeoutMs={5000}/>
    </Suspense>
  </div>;
}

function App({suspenseId}) {
  return (
    <>
      <h1>React SSR renderToContainer</h1>
      <Suspense fallback={"Loading..."}>
        <ComponentThatSuspends suspenseId={suspenseId} timeoutMs={2000}/>
      </Suspense>
    </>
  );
}

export default App;
