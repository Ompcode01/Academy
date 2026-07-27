"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const employee_routes_1 = __importDefault(require("./routes/employee.routes"));
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const role_routes_1 = __importDefault(require("./routes/role.routes"));
const permission_routes_1 = __importDefault(require("./routes/permission.routes"));
const rolePermission_routes_1 = __importDefault(require("./routes/rolePermission.routes"));
const userAccount_routes_1 = __importDefault(require("./routes/userAccount.routes"));
const userRole_routes_1 = __importDefault(require("./routes/userRole.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({
    extended: true,
}));
app.get("/", (req, res) => {
    res.json({
        message: "LMS Backend Running"
    });
});
app.use("/api/departments", department_routes_1.default);
app.use("/api/employees", employee_routes_1.default);
app.use("/api/roles", role_routes_1.default);
app.use("/api/permissions", permission_routes_1.default);
app.use("/api/role-permissions", rolePermission_routes_1.default);
app.use("/api/user-accounts", userAccount_routes_1.default);
app.use("/api/user-roles", userRole_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
exports.default = app;
