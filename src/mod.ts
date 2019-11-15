import rErrors = require('restify-errors');
const { Types: { ObjectId } } = require('mongoose');
import moment = require('moment');
import { RequestHandlerType, Route, RouteOptions } from "restify";

interface restifyParamsOptions {
	trimStrings: boolean,
}



interface RouteSchema extends RouteOptions {
	path: string,
	description?: string,
	tag?: string,
	params?: RouteParamSchema,
}

interface RouteParamSchema {

}

module.exports = function(routes: Array<Route>, options: restifyParamsOptions = { trimStrings: true }) : RequestHandlerType {
	return (req, res, next) => {
		console.log(options);
	};
};
