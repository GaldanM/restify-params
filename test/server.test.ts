import { Request, Response } from "restify";

const restify = require('restify');
const middlewares = require('./middlewares.test');

(async function() {
	try {
		const server = restify.createServer();

		server.get('/', (req: Request, res: Response) => {
			res.json(200, 'Salut');
		});

		middlewares(server);

		server.listen(12345, () => {
			console.log(`Server listening: http://localhost:12345/`);
		});
	} catch (err) {
		console.error(err.stack);
	}
}());
