"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const restify = require('restify');
const rp = require('request-promise');
const chai = require('chai');
const expect = chai.expect;
const RestifyParams = require('../src/mod');
const restify_errors_1 = require("restify-errors");
let schemaRoutes = {
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
async function mockTest(path, { qs, body } = {}) {
    function initServer() {
        const server = restify.createServer();
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
function mockRequest(route, params = {}, pluginsEnabled = true) {
    return {
        getRoute: () => ({ spec: route }),
        getContentLength: () => Object.keys(params).length,
        params: pluginsEnabled ? params : {},
    };
}
describe('Initial tests', () => {
    it('Should return an error if plugins are not enabled with params', done => {
        const req = mockRequest(schemaRoutes.gettechnos, { isValidated: true }, false);
        RestifyParams()(req, {}, (err) => {
            expect(err).to.be.an.instanceOf(restify_errors_1.RestError);
            done();
        });
    });
    it('Should set req.params to empty object if no params are passed', () => {
        const req = mockRequest(schemaRoutes.gettechnos);
        RestifyParams()(req, {}, () => { });
        expect(req.params).to.eql({});
    });
    it('Should map path params to req.params', () => {
        const req = mockRequest(schemaRoutes.gettechnoidname, { id: 'thisisanid', name: 'thisisaname' });
        RestifyParams()(req, {}, () => { });
        expect(req.params).to.have.all.keys(['id', 'name']);
    });
    it('Should delete unregistered params', () => {
        const req = mockRequest(schemaRoutes.getusers, { notRegistered: 2 });
        RestifyParams()(req, {}, () => { });
        expect(req.params).to.not.have.property('notRegistered');
    });
    it('Should put the default value if param not sent', () => {
        const req = mockRequest(schemaRoutes.getcompanies);
        RestifyParams()(req, {}, () => { });
        expect(req.params.status).to.equals('online');
    });
});
//# sourceMappingURL=test.js.map