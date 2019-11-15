import { Server, plugins } from 'restify';
const restifyParams = require('../');

module.exports = function(server: Server) {
	server.on('NotFound', (req, res) => res.json(404, 'Not Found'));
	server.on('MethodNotAllowed', (req, res) => res.json(405, 'Method Not Allowed'));
	server.on('UnsupportedMediaType', (req, res) => res.json(415, 'Unsupported Media Type'));

	server.use(plugins.gzipResponse());
	server.use(plugins.queryParser({ mapParams: true }));
	server.use(plugins.bodyParser({
		mapParams: true,
		keepExtensions: true,
		maxBodySize: 50000000000,
	}));
	server.use(plugins.fullResponse());
	server.use(restifyParams(server.router.getRoutes()));
};
