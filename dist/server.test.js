"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const restify = require('restify');
const middlewares = require('./middlewares.test');
(async function () {
    try {
        const server = restify.createServer();
        server.get('/', (req, res) => {
            res.json(200, 'Salut');
        });
        middlewares(server);
        server.listen(12345, () => {
            console.log(`Server listening: http://localhost:12345/`);
        });
    }
    catch (err) {
        console.error(err.stack);
    }
}());
//# sourceMappingURL=server.test.js.map