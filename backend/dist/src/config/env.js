"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const requiredEnv = [
    "DATABASE_URL",
    "JWT_SECRET"
];
requiredEnv.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`${key} is missing in environment variables`);
    }
});
const env = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: Number(process.env.PORT) || 5000,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
    LOG_LEVEL: process.env.LOG_LEVEL || "info"
};
exports.default = env;
