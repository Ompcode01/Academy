"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serialize = void 0;
const serialize = (data) => {
    return JSON.parse(JSON.stringify(data, (_, value) => typeof value === "bigint"
        ? value.toString()
        : value));
};
exports.serialize = serialize;
