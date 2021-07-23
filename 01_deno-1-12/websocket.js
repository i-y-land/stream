for await (const connection of Deno.listen({ port: 8080 })) {
  for await (const event of Deno.serveHttp(connection)) {
    if (event.request.headers.get("upgrade") != "websocket") {
      event.respondWith(new Response("Server only handle websocket", { status: 400 }));
    }

    const { websocket, response } = Deno.upgradeWebSocket(event.request);
    websocket.addEventListener('open', () => console.log("New connection established."));
    websocket.addEventListener('message', (e) => {
      console.log(`Message from client: ${e.data}`);
      websocket.send(new Date().toString());
    });

    event.respondWith(response);
  }
}

