import rErrors = require('restify-errors');
import moment = require('moment');

import { Request, RequestHandlerType, Route } from 'restify';
import { RouteSchema, RPOptions, RouteSchemaParams, RouteSchemaParam, AllowedTypes, RequestParams } from '../types/restify-params';
import { Types } from 'mongoose';

const possibleTypes = ['string', 'number', 'boolean', 'date', 'id', 'object'];

function retrieveRouteSchemaParams(calledRouteSchema: RouteSchema) : RouteSchemaParams {
	const pathParams = calledRouteSchema.path.toString()
		.split('/')
		.filter(param => param[0] === ':')
		.map(param => param.slice(1));
	return pathParams.reduce((params, param) : RouteSchemaParams => ({
		...params,
		[param]: {
			...params[param],
			type: (param.toLowerCase().includes('id') && 'id') || 'string',
			required: true
		}
	}), calledRouteSchema.params || {});
}

function handleParameter(parentParameters: RequestParams, pName: string, pSchema: RouteSchemaParam, ppName: string = '') : AllowedTypes {
	function handleDefault(parameter: AllowedTypes, pRequired: boolean = false, pDefaultValue: AllowedTypes = false) : AllowedTypes {
		if (!parameter) {
			if (pRequired && !pDefaultValue) {
				throw new rErrors.MissingParameterError(`${pFullName} is required`);
			} else if (pDefaultValue) {
				return pDefaultValue;
			}
		}
		return parameter;
	}

	let {
		type: pType, required: pRequired,
		defaultValue: pDefaultValue, expected: pExpected,
		params: pParams,
	} = pSchema;

	const pFullName = `${ppName}${(!ppName.endsWith(']') && pName) || ''}`;

	if (pExpected && !Array.isArray(pExpected)) {
		pExpected = [pExpected];
	}

	const parameterValue = handleDefault(parentParameters[pName], pRequired, pDefaultValue);

	return parameterValue;
}

module.exports = function(options: RPOptions = { trimStrings: true }) : RequestHandlerType {
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

			const parameters = Object.entries(schemaParameters).reduce((params: RequestParams, [paramName, paramSchema]) : RequestParams => {
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
		} catch (err) {
			return next(err);
		}
	};
};
