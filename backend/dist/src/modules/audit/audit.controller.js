"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = void 0;
const audit_service_1 = __importDefault(require("./audit.service"));
const getAuditLogs = async (req, res) => {
    try {
        const { username, departmentName, type, search, page, limit, dateFrom, dateTo } = req.query;
        const result = await audit_service_1.default.getAuditLogs({
            username: username,
            departmentName: departmentName,
            type: type,
            search: search,
            dateFrom: dateFrom,
            dateTo: dateTo,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
        });
        res.json({ success: true, ...result });
    }
    catch (error) {
        console.error("Audit log retrieval error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAuditLogs = getAuditLogs;
