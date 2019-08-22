const rErrors = require('restify-errors');
const { Types: { ObjectId } } = require('mongoose');
const moment = require('moment');
moment.suppressDeprecationWarnings = true;

module.exports = function(routes, { trimStrings = true } = {}) {
	return (req, res, next) => {
		function getRouteParamSchema() {
			function formatParams([paramName, paramSpecs]) {
				return {
					name: paramName,
					...paramSpecs,
					...paramSpecs.params && { params: Object.entries(paramSpecs.params).map(formatParams) },
				};
			}

			// Get specs from called route
			const registeredRoute = routes[req.route.name];

			// Get Params
			const pathParams = registeredRoute.path.split('/').filter(param => param[0] === ':').map(param => param.slice(1));
			// Add pathParams to params as strings
			const params = pathParams.reduce((params, param) => ({
				...params,
				[param]: { ...params[param], type: (param.toLowerCase().includes('id') && ObjectId) || String, required: true },
			}), registeredRoute.spec.params || {});

			// Format parameters and deep parameters
			return Object.entries(params).map(formatParams);
		}
		function handleParam(receivedParentParameter, schemaParameter) {
			// Used to check if the parameter is required and replace a missing one by it's default value
			function handleDefault() {
				// If parent have the field, no need to check for required or defaultValue
				if (!Object.hasOwnProperty.call(receivedParentParameter, pName)) {
					if (pRequired && !pDefaultValue) {
						throw new rErrors.MissingParameterError(`${pFullName} is required`);
					} else if (pDefaultValue) {
						// defaultValue can be a function that will return the correct value depending on "req"
						return Object.getPrototypeOf(pDefaultValue).constructor === Function ?
							pDefaultValue(req, schemaParameter) :
							pDefaultValue;
					}
				} else {
					return receivedParentParameter[pName];
				}
			}

			function handleString() {
				// Check type
				if (Object.getPrototypeOf(receivedParameter).constructor !== String) {
					throw new rErrors.BadRequestError(`${pFullName}: expected String but got some '${Object.getPrototypeOf(receivedParameter).constructor.name}' instead`);
				}

				// Format value
				receivedParameter = (trimStrings && receivedParameter.trim()) || receivedParameter;
				// If parameter is supposed to be an email, we lowercase it and check if the format is valid
				if (schemaParameter.isEmail) {
					receivedParameter = receivedParameter.toLowerCase();
					const emailRegex = /^(?:(?:[^<>()\[\].,;:\s@"]+(?:\.[^<>()\[\].,;:\s@"]+)*)|(?:".+"))@(?:(?:[^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/ui;

					if (!emailRegex.test(receivedParameter)) {
						throw new rErrors.BadRequestError(`${pFullName}: '${JSON.stringify(receivedParameter).split('"').join('')}' is not a valid email`);
					}
				}

				// Check value with expected
				if (pExpected && !pExpected.some(expectedVal => receivedParameter === expectedVal)) {
					throw new rErrors.BadRequestError(`${pFullName}: invalid value '${JSON.stringify(receivedParameter).split('"').join('')}', expected values are [${pExpected.map(val => `'${val}'`).join(' OR ')}]`);
				}

				return receivedParameter;
			}
			function handleNumber() {
				// Check type
				if (Object.getPrototypeOf(receivedParameter).constructor === String) {
					receivedParameter = receivedParameter.replace(',', '.');
				}
				const number = Number(receivedParameter);
				if (Number.isNaN(number)) {
					throw new rErrors.BadRequestError(`${pFullName}: expected Number but '${JSON.stringify(receivedParameter).split('"').join('')}' is NaN`);
				}

				// Check value with expected
				if (pExpected && !pExpected.some(expectedVal => number === expectedVal)) {
					throw new rErrors.BadRequestError(`${pFullName}: invalid value '${receivedParameter}', expected values are [${pExpected.map(val => `'${val}'`).join(' OR ')}]`);
				}

				if (schemaParameter.min && number < schemaParameter.min) {
					throw new rErrors.BadRequestError(`${pFullName}: minimum value specified '${schemaParameter.min}' is above the received value '${number}'`);
				}
				if (schemaParameter.max && number > schemaParameter.max) {
					throw new rErrors.BadRequestError(`${pFullName}: maximum value specified '${schemaParameter.max}' is below the received value '${number}'`);
				}

				return number;
			}
			function handleBoolean() {
				if (Object.getPrototypeOf(receivedParameter).constructor === Boolean) {
					return receivedParameter;
				} else if (receivedParameter === 'true') {
					return true;
				} else if (receivedParameter === 'false') {
					return false;
				}
				throw new rErrors.BadRequestError(`${pFullName}: expected Boolean but got '${JSON.stringify(receivedParameter).split('"').join('')}' which cannot be transformed into Boolean`);
			}
			function handleDate() {
				// Check type
				let date = moment(receivedParameter);
				if (!date.isValid()) {
					date = moment(Number(receivedParameter));
					if (!date.isValid()) {
						throw new rErrors.BadRequestError(`${pFullName}: expected Date but got '${JSON.stringify(receivedParameter).split('"').join('')}' which is not a valid Date`);
					}
				}
				return date;
			}
			function handleObjectID() {
				// Check type
				if (!(/^(?=[a-f\d]{24}$)(?=\d+[a-f]|[a-f]+\d)/iu).exec(receivedParameter)) {
					throw new rErrors.BadRequestError(`${pFullName}: expected ObjectID but got '${JSON.stringify(receivedParameter).split('"').join('')}' which is not a valid ObjectID`);
				}

				// Check value with expected
				if (pExpected && !pExpected.some(expectedVal => receivedParameter === expectedVal)) {
					throw new rErrors.BadRequestError(`${pFullName}: invalid value '${receivedParameter}', expected values are [${pExpected.map(val => `'${val}'`).join(' OR ')}]`);
				}

				return receivedParameter;
			}
			function handleObject() {
				// Parse the object if in JSON form
				let receivedParameterObj;
				try {
					receivedParameterObj = Object.getPrototypeOf(receivedParameter).constructor === String ?
						JSON.parse(receivedParameter) :
						receivedParameter;
				} catch (err) {
					throw new rErrors.BadRequestError(`${pFullName} should be an object but got a non-valid JSON String`);
				}
				if (Object.getPrototypeOf(receivedParameterObj).constructor !== Object) {
					throw new rErrors.BadRequestError(`${pFullName} should be an Object but got some '${Object.getPrototypeOf(receivedParameterObj).constructor.name}' instead`);
				}

				/*
                 * Check if Object respect the params specified in the route
                 * If it's nested it will recursively call handleParam and construct the new object thanks to the reduce
                 */
				if (pParams) {
					receivedParameterObj = pParams.reduce((acc, subSchemaParameter) => {
						const newField = { [subSchemaParameter.name]: handleParam(receivedParameterObj, { ...subSchemaParameter, parentName: `${pName}.` }) };

						return {
							...acc,
							...newField[subSchemaParameter.name] && newField,
						};
					}, {});
				}

				return receivedParameterObj;
			}
			function handleArray() {
				// Parse the array if in JSON form
				let receivedParameterArray = receivedParameter;
				if (Object.getPrototypeOf(receivedParameter).constructor === String) {
					try {
						receivedParameterArray = JSON.parse(receivedParameter);
					} catch (err) {
						receivedParameterArray = receivedParameter.split(',').map(item => item.trim());
					}
				}

				// Get the real type precised in the route
				const [newType] = pType;

				// Check the type of array received
				if (Object.getPrototypeOf(receivedParameterArray).constructor !== Array) {
					throw new rErrors.BadRequestError(`${pFullName} should be an Array of ${newType.name} but got some '${Object.getPrototypeOf(receivedParameterArray).constructor.name}' instead`);
				}

				// Check if each item in the array is good to go
				receivedParameterArray = receivedParameterArray.map((item, index) => handleParam(
					{ [index]: item },
					{ name: `${index}`, type: newType, params: pParams, parentName: `${pName}[${index}]`, expected: pExpected }
				));

				return receivedParameterArray;
			}

			function handleTransform() {
				if (Object.getPrototypeOf(schemaParameter.transform).constructor !== Function) {
					throw new rErrors.InternalServerError(`${pFullName}: transform is not a function`);
				}
				return schemaParameter.transform(paramFormatted, req, schemaParameter);
			}
			function handleValidate() {
				if (Object.getPrototypeOf(schemaParameter.validate).constructor !== Function) {
					throw new rErrors.InternalServerError(`${pFullName}: validate is not a function`);
				}

				const err = schemaParameter.validate(paramFormatted, req, schemaParameter);
				if (err) {
					if (err instanceof Error) {
						throw new rErrors.BadRequestError(err.body.message);
					} else {
						throw new rErrors.InternalServerError(`${pFullName}: validate should return an Error object`);
					}
				}
			}

			// Destructuring the route schema parameter
			let {
				name: pName, type: pType, defaultValue: pDefaultValue,
				required: pRequired, params: pParams,
				parentName: ppName = '', expected: pExpected,
			} = schemaParameter;
			// Set the full path of the parameter for errors debugging pruposes
			const pFullName = `${ppName}${(!ppName.endsWith(']') && pName) || ''}`;

			// If expected values are set, check if they are in the correct format
			if (pExpected) {
				if (Object.getPrototypeOf(pExpected).constructor !== Array) {
					pExpected = [pExpected];
				} else if (pExpected[0] && Object.getPrototypeOf(pExpected[0]).constructor === Array) {
					throw new rErrors.InternalServerError('Expected values cannot be an Array of Array');
				}
			}

			// Retrieve actual value sent for currently handling schema
			let receivedParameter = handleDefault();
			// If the parameter is missing, not need to handle it
			if (receivedParameter === null || receivedParameter === undefined) {
				return null;
			}

			const handleFunctions = {
				handleString, handleNumber, handleBoolean,
				handleDate, handleObjectID,
				handleObject, handleArray,
			};

			// Check which function to call depending on the type defined in the schema
			const pTypeName = pType.name || Object.getPrototypeOf(pType).constructor.name;
			const functionToCall = handleFunctions[`handle${pTypeName}`];
			// If function is not present, it means this plugin does not support the type yet
			if (!functionToCall) {
				throw new rErrors.InternalServerError(`'${pFullName}' has an unsupported type: '${pTypeName}'`);
			}
			let paramFormatted = functionToCall();

			// Function used to call the transform function set in the route schema (optional)
			if (schemaParameter.transform) {
				paramFormatted = handleTransform();
			}
			// Function used to call the validate function set in the route schema (optional)
			if (schemaParameter.validate) {
				handleValidate();
			}

			return paramFormatted;
		}

		try {
			const routeParameterSchemas = getRouteParamSchema();

			// If no params are defined, no need to handle them
			if (!routeParameterSchemas.length) {
				return next();
			}

			/*
             * This code will check and re-write req.params with the correct data
             * by going through all parameters described in the route and checking
             * if the provided parameters are good
             */
			req.params = routeParameterSchemas.reduce((params, schemaParameter) => {
				const parameter = handleParam(req.params, schemaParameter);
				return {
					...params,
					...parameter !== null && { [schemaParameter.name]: parameter },
				};
			}, {});

			// Filter unwanted params
			const validParameterNames = routeParameterSchemas.map(parameterSchema => parameterSchema.name);
			Object.keys(req.params).forEach(receivedParameterName => {
				if (!validParameterNames.some(validParameterName => validParameterName === receivedParameterName)) {
					delete req.params[receivedParameterName];
				}
			});

			return next();
		} catch (err) {
			return next(err);
		}
	};
};
