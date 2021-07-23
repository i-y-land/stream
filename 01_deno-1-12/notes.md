1. REPL TS and import

    Accepts TS, no compile step so no type safety

    import { assert } from "https://deno.land/std@0.102.0/testing/asserts.ts"

2. Crypto updates

    Progress, need `importKey` and `exportKey` to persists key 
    Not yet ready for production.
   
    Not yet standardized Node, Chrome Canary
    `crypto.randomUUID()`

3. V8 9.2 features

    ```js
    const xs = [ 42, 24, 12 ];
   
    xs[1]; // 24
   
    xs.at(1); // 24
   
    xs.at(-1) // 12
```

4. Deprecation

    `Deno.copy` along with other I/O - will be moved to STD   

5. Test --shuffle
   
    Test from HTTP project
    
    deno test --allow-all
    
    deno test --allow-all --shuffle
    
    deno test --allow-all --shuffle=42

6. Deno.serveHttp (quick) + websocket

    deno run --allow-all --unstable 01_deno-1-12/http.js
   
    deno run --allow-all --unstable 01_deno-1-12/websocket.js
    deno run --allow-all websocket-client.js


