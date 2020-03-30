import { RequestHandlerType, Route, RouteSpec, Server } from 'restify';

type AllowedTypes = string | number | boolean | object;

interface RPOptions {
	trimStrings: boolean,
}

type RestifyParamsRouteFunction = (opts: string | RouteSchema, ...handlers: RequestHandlerType[]) => Route | boolean;
export interface RPServer extends Server {
	get: RestifyParamsRouteFunction;
	head: RestifyParamsRouteFunction;
	opts: RestifyParamsRouteFunction;
	post: RestifyParamsRouteFunction;
	patch: RestifyParamsRouteFunction;
	put: RestifyParamsRouteFunction;
	del: RestifyParamsRouteFunction;
}

export interface RouteSchemas {
	[key: string]: RouteSchema
}

interface RouteSchema {
	path: string | RegExp,
	description?: string,
	tag?: string,
	params?: RouteSchemaParams,
}







type RecursiveArray<T> = T | RecursiveArray<T>[];

interface allowedTypesMap {
	string: string;
	email: string;
	date: string;
	id: string;
	number: number;
	boolean: boolean;
	object: object;
}
type RecursiveTypes = RecursiveArray<keyof allowedTypesMap>;

export interface RouteSchemaParams {
	[key: string]: RouteSchemaParam<RecursiveTypes>
}

type ReifyRecursiveType<T> = T extends keyof allowedTypesMap ?
							 allowedTypesMap[T] :
							 (T extends (infer U)[] ? ReifyRecursiveType<U>[] : never)

export type RouteSchemaParam <T extends RecursiveTypes> = {
	type: T,
	required?: boolean,
	defaultValue?: ReifyRecursiveType<T>,
	expected?: ReifyRecursiveType<T>[],
	transform?: (value: ReifyRecursiveType<T>) => keyof allowedTypesMap,
	validate?: (value: ReifyRecursiveType<T>) => boolean,
} & RouteSchemaParamExtensions<T>;

type RouteSchemaParamExtensions<T extends RecursiveTypes> =
	RouteSchemaParamString<T> |
	RouteSchemaParamNumber<T> |
	RouteSchemaParamObject<T>;

type RouteSchemaParamString<T extends RecursiveTypes> =
	T extends RecursiveArray<'string' | 'email'> ?
	{ regexp?: RegExp } :
	{};

type RouteSchemaParamNumber<T extends RecursiveTypes> =
	T extends RecursiveArray<'number'> ? {
		min?: number,
		max?: number,
	} : {};

type RouteSchemaParamObject<T extends RecursiveTypes> =
	T extends RecursiveArray<'object'> ?
	{ params?: RouteSchemaParams } :
	{};

export interface RequestParams {
	[key: string]: AllowedTypes | AllowedTypes[],
}
