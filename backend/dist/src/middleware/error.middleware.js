"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("../utils/AppError"));
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler = (err, req, res, next) => {
    /*
        Log every error
    */
    logger_1.default.error({
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip
    });
    /*
        Default Error Values
    */
    let statusCode = 500;
    let message = "Internal Server Error";
    let errorCode = "INTERNAL_ERROR";
    /*
        Operational Errors
        (Our Custom Errors)
    */
    if (err instanceof AppError_1.default) {
        statusCode = err.statusCode;
        message = err.message;
        errorCode = err.errorCode;
    }
    /*
        Production Response
    */
    return res
        .status(statusCode)
        .json({
        success: false,
        message,
        errorCode,
        timestamp: new Date().toISOString()
    });
};
exports.default = errorHandler;
