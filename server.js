import express from "express";
import { createServer as createViteServer } from "vite";
import { Readable } from "node:stream";

const app = express();
const vite = await createViteServer({
  server: {
    middlewareMode: true,
    hmr: false,
  },
  appType: "custom",
});
app.use(vite.middlewares);

let suspenseIdCounter = 0;
app.use(async (request, response) => {
  const { prerender, render } = await vite.ssrLoadModule(
    "/src/entry-server.jsx",
  );

  // Get the shell and the postponed state.
  const { shell, postponed } = await prerender();

  response.statusCode = 200;
  response.setHeader("content-type", "text/html");

  // Stream the shell.
  const shellStream = Readable.from([shell]);
  shellStream.pipe(response, { end: false });

  // Resume and render the rest of the app.
  shellStream.on("end", () => {
    // TODO: this can be done in parallel but I suck at streams.
    render(response, postponed, suspenseIdCounter++);
  });
});

app.listen(8080);
