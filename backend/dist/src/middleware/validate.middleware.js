"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query
        });
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errorCode: "VALIDATION_ERROR",
                errors: result.error?.errors || result.error,
            });
        }
        req.body = result.data?.body || req.body;
        next();
    };
};
exports.default = validate;
