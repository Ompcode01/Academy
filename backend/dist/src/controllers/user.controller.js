"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = void 0;
const AppError_1 = __importDefault(require("../utils/AppError"));
const getUser = async (req, res) => {
    throw new AppError_1.default("User not found", 404, "USER_NOT_FOUND");
};
exports.getUser = getUser;
