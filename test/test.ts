const restify = require('restify');
const rp = require('request-promise');
const chai = require('chai');
const expect = chai.expect;

const RestifyParams = require('../src/mod');

import { RestError } from 'restify-errors';
import { RequestParams, RouteSchema, RouteSchemas, RPServer } from '../types/restify-params';

let schemaRoutes: RouteSchemas = {
	gettechnos: {
		path: '/technos',
		description: 'SALUT',
		tag: 'techno'
	},
	gettechnoidname: {
		path: '/technos/:id/:name',
		description: 'SALUT',
		tag: 'techno'
	},
	getusers: {
		path: '/users',
		description: 'SALUT',
		tag: 'user',
		params: {
			isValidated: { type: 'boolean' },
		},
	},
	getuserid: {
		path: '/users/:id/:name',
		description: 'SALUT',
		tag: 'user',
		params: {
			ok: { type: 'boolean' }
		}
	},
	getcompanies: {
		path: '/companies',
		description: 'SALUT',
		tag: 'company',
		params: {
			status: {
				type: 'string',
				expected: ['online', 'offline'],
				defaultValue: ['online'],
				regexp: /lol/,
				max: 2,

			},
			partnership: {
				type: 'string',
			}
		}
	}
};

async function mockTest(path: string, { qs, body }: { qs?: any, body?: any } = {}) {
	function initServer() : Promise<RPServer> {
		const server: RPServer = restify.createServer();

		server.get(schemaRoutes.gettechnos, (req, res) => res.json(200, {}));
		server.get(schemaRoutes.getusers, (req, res) => res.json(200, {}));
		server.get(schemaRoutes.getuserid, (req, res) => res.json(200, {}));
		server.post(schemaRoutes.getusers, (req, res) => res.json(200, {}));

		server.use(restify.plugins.queryParser({ mapParams: true }));
		server.use(restify.plugins.bodyParser({ mapParams: true }));

		server.use(RestifyParams());

		return new Promise(resolve => {
			server.listen(12345, () => {
				console.log('Server listening @ http://localhost:12345');
				return resolve(server);
			});
		});
	}

	const server = await initServer();
	const res = await rp.get({
		uri: `http://localhost:12345${path}`,
		qs,
		body,
		json: true,
		resolveWithFullResponse: true
	});
	expect(res.statusCode).to.equals(200);
	server.close();
}
function mockRequest(route: RouteSchema, params: RequestParams = {}, pluginsEnabled: boolean = true) {
	return {
		getRoute: () => ({ spec: route }),
		getContentLength: () : number => Object.keys(params).length,
		params: pluginsEnabled ? params : {},
	};
}

// it ('Should ', () => {
// 	const req = mockRequest(schemaRoutes.);
// 	RestifyParams()(req, {}, () => {});
//
// 	expect(req.params).to;
// });

describe('Initial tests', () => {
	it('Should return an error if plugins are not enabled with params', done => {
		const req = mockRequest(schemaRoutes.gettechnos, { isValidated: true }, false);
		RestifyParams()(req, {}, (err: RestError) => {
			expect(err).to.be.an.instanceOf(RestError);
			done();
		});
	});
	it('Should set req.params to empty object if no params are passed', () => {
		const req = mockRequest(schemaRoutes.gettechnos);
		RestifyParams()(req, {}, () => {});

		expect(req.params).to.eql({});
	});
	it('Should map path params to req.params', () => {
		const req = mockRequest(schemaRoutes.gettechnoidname, { id: 'thisisanid', name: 'thisisaname' });
		RestifyParams()(req, {}, () => {});

		expect(req.params).to.have.all.keys(['id', 'name']);
	});
	it ('Should delete unregistered params', () => {
		const req = mockRequest(schemaRoutes.getusers, { notRegistered: 2 });
		RestifyParams()(req, {}, () => {});

		expect(req.params).to.not.have.property('notRegistered');
	});
	it ('Should put the default value if param not sent', () => {
		const req = mockRequest(schemaRoutes.getcompanies);
		RestifyParams()(req, {}, () => {});

		expect(req.params.status).to.equals('online');
	});
	// it ('Should check the expected option', done => {
	// 	let req = mockRequest(schemaRoutes.getcompanies, { status: 'online' });
	// 	RestifyParams()(req, {}, () => {});
	//
	// 	expect(req.params.status).to.equals('online');
	//
	// 	req = mockRequest(schemaRoutes.getcompanies, { status: 'notValid' });
	// 	RestifyParams()(req, {}, (err: RestError) => {
	// 		expect(err).to.be.an.instanceOf(RestError);
	// 		done();
	// 	});
	// });
});
