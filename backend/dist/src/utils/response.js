"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
const successResponse = (res, data, message = "Success", statusCode = 200) => {
    const response = {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    };
    return res
        .status(statusCode)
        .json(response);
};
exports.successResponse = successResponse;
const errorResponse = (res, message, errorCode = "INTERNAL_ERROR", statusCode = 500) => {
    const response = {
        success: false,
        message,
        errorCode,
        timestamp: new Date().toISOString()
    };
    return res
        .status(statusCode)
        .json(response);
};
exports.errorResponse = errorResponse;
