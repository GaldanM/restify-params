"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const restify_1 = require("restify");
const restifyParams = require('../');
module.exports = function (server) {
    server.on('NotFound', (req, res) => res.json(404, 'Not Found'));
    server.on('MethodNotAllowed', (req, res) => res.json(405, 'Method Not Allowed'));
    server.on('UnsupportedMediaType', (req, res) => res.json(415, 'Unsupported Media Type'));
    server.use(restify_1.plugins.gzipResponse());
    server.use(restify_1.plugins.queryParser({ mapParams: true }));
    server.use(restify_1.plugins.bodyParser({
        mapParams: true,
        keepExtensions: true,
        maxBodySize: 50000000000,
    }));
    server.use(restify_1.plugins.fullResponse());
    server.use(restifyParams(server.router.getRoutes()));
};
//# sourceMappingURL=middlewares.test.js.map