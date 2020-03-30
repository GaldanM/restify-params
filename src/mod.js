"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rErrors = require("restify-errors");
const possibleTypes = ['string', 'number', 'boolean', 'date', 'id', 'object'];
function retrieveRouteSchemaParams(calledRouteSchema) {
    const pathParams = calledRouteSchema.path.toString()
        .split('/')
        .filter(param => param[0] === ':')
        .map(param => param.slice(1));
    return pathParams.reduce((params, param) => ({
        ...params,
        [param]: {
            ...params[param],
            type: (param.toLowerCase().includes('id') && 'id') || 'string',
            required: true
        }
    }), calledRouteSchema.params || {});
}
function handleParameter(parentParameters, pName, pSchema, ppName = '') {
    function handleDefault(parameter, pRequired = false, pDefaultValue = false) {
        if (!parameter) {
            if (pRequired && !pDefaultValue) {
                throw new rErrors.MissingParameterError(`${pFullName} is required`);
            }
            else if (pDefaultValue) {
                return pDefaultValue;
            }
        }
        return parameter;
    }
    let { type: pType, required: pRequired, defaultValue: pDefaultValue, expected: pExpected, params: pParams, } = pSchema;
    const pFullName = `${ppName}${(!ppName.endsWith(']') && pName) || ''}`;
    if (pExpected && !Array.isArray(pExpected)) {
        pExpected = [pExpected];
    }
    const parameterValue = handleDefault(parentParameters[pName], pRequired, pDefaultValue);
    return parameterValue;
}
module.exports = function (options = { trimStrings: true }) {
    return (req, res, next) => {
        try {
            if (req.getContentLength() > 0 && !Object.keys(req.params).length) {
                return next(new rErrors.InternalError('You must use restify plugins "queryParser" and "bodyParser" for Restify-Params to work correctly'));
            }
            const schemaParameters = retrieveRouteSchemaParams(req.getRoute().spec);
            if (!Object.keys(schemaParameters).length) {
                req.params = {};
                return next();
            }
            const parameters = Object.entries(schemaParameters).reduce((params, [paramName, paramSchema]) => {
                const paramHandled = handleParameter(req.params, paramName, paramSchema);
                if (!paramHandled) {
                    return params;
                }
                return {
                    ...params,
                    [paramName]: paramHandled,
                };
            }, {});
            req.params = parameters;
            return next();
        }
        catch (err) {
            return next(err);
        }
    };
};
//# sourceMappingURL=mod.js.map