for await (const connection of Deno.listen({ port: 8080 })) {
  for await (const event of Deno.serveHttp(connection)) {
    if (event.request.method === "GET") {
      event.respondWith(new Response("Hello World", { status: 404 }));
    }
  }
}
