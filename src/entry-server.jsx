import { prerenderToNodeStream } from "react-dom/static";
import { resumeToPipeableStream } from "react-dom/server";
import { Suspense } from "react";
import App from "./App";

async function streamToString(stream) {
  return new Promise((resolve, reject) => {
    let data = "";
    stream.on("data", (chunk) => {
      console.log("chunk", chunk);
      data += chunk;
    });
    stream.on("end", () => {
      console.log("end");
      resolve(data);
    });
    stream.on("error", reject);
  });
}

export async function prerender() {
  // Pre-render the initial HTML shell, and get the postponed state.

  // We immediately abort the stream to pause it.
  // The shell is suspended, on an infinite promise.
  const controller = new AbortController();
  setTimeout(() => {
    controller.abort();
  }, 0);
  const { prelude, postponed } = await prerenderToNodeStream(
    <div>
      <Suspense>{new Promise(() => {})}</Suspense>
    </div>,
    {
      signal: controller.signal,
    },
  );

  // Hardcoding a string, since that's what this use case needs.
  // You can use this string to hardcode it into the server response.
  const shell = `
    <html>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>React SSR Bug Repro</title>
        <link rel="modulepreload" fetchPriority="low" href="/src/entry-client.jsx"/>
      </head>
      <body>
        <div id="root">
            ${await streamToString(prelude)}
        </div>
      </body>
    </html>
  `;

  return { shell, postponed };
}

export function render(response, postponed, suspenseIdCounter) {
  // Resume the stream and render the rest of the app.

  const { pipe } = resumeToPipeableStream(
    <div>
      <Suspense>
        <App suspenseId={suspenseIdCounter} />
      </Suspense>
    </div>,
    postponed,
    {
      bootstrapModules: ["/src/entry-client.jsx"],
      onShellReady: () => {
        pipe(response);
      },
    },
  );
}
