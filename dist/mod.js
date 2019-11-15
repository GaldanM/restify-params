"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { Types: { ObjectId } } = require('mongoose');
module.exports = function (routes, options = { trimStrings: true }) {
    return (req, res, next) => {
        console.log(options);
    };
};
//# sourceMappingURL=mod.js.map