"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const listController = require('app/controllers/listController');
module.exports = (server) => {
    server.get({
        path: '/lists',
        description: 'get lists',
        tag: 'lists',
        params: {
            query: { type: 'string' },
            coderId: { type: 'id' },
        },
    }, listController.getLists);
    server.get({
        path: '/lists/:id',
        description: 'Get a list by id',
        tag: 'lists',
    }, listController.getListById);
    server.post({
        path: '/lists',
        description: 'Creates a list',
        tag: 'lists',
        params: {
            name: {
                required: true,
                type: 'string',
            },
            coachId: {
                required: true,
                type: 'id',
            },
            locked: { type: 'boolean' },
            subscribers: {
                type: ['object'],
                params: {
                    _coach: { type: 'string', required: true },
                    role: { type: 'number', required: true },
                },
            },
        },
    }, listController.createList);
    server.post({
        path: '/lists/:id/coder',
        tag: 'lists',
        params: {
            coderId: {
                required: true,
                type: ObjectId,
            },
        },
        description: 'add a coder to list',
    }, listController.addCoderToList);
    server.patch({
        path: '/lists/:id',
        description: 'edit a list',
        tag: 'lists',
        params: {
            name: { type: String },
            locked: { type: Boolean },
            addedSubscribers: {
                type: [Object],
                params: {
                    _coach: { type: String, required: true },
                    role: { type: Number, required: true },
                },
            },
            removedSubscribers: {
                type: [Object],
                params: {
                    _coach: { type: String, required: true },
                    role: { type: Number, required: true },
                },
            },
            changedSubscribers: {
                type: [Object],
                params: {
                    _coach: { type: String, required: true },
                    role: { type: Number, required: true },
                },
            },
        },
    }, listController.editList);
    server.del({
        path: '/lists/:id',
        tag: 'lists',
        description: 'Deletes a list',
    }, listController.removeList);
    server.del({
        path: '/lists/:id/coder',
        tag: 'lists',
        params: {
            coderId: {
                required: true,
                type: ObjectId,
            },
        },
        description: 'delete a coder of list',
    }, listController.removeCoderOfList);
};
//# sourceMappingURL=routes.test.js.map