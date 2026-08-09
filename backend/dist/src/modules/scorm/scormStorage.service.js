"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScormStorageService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const adm_zip_1 = __importDefault(require("adm-zip"));
class ScormStorageService {
    static baseStoragePath = path_1.default.join(process.cwd(), "public", "storage", "scorm");
    static getBaseStorageDir() {
        if (!fs_1.default.existsSync(this.baseStoragePath)) {
            fs_1.default.mkdirSync(this.baseStoragePath, { recursive: true });
        }
        return this.baseStoragePath;
    }
    static extractPackage(courseId, buffer) {
        const baseDir = this.getBaseStorageDir();
        const courseFolder = path_1.default.join(baseDir, courseId.toString());
        // Clean existing folder if replacing package
        if (fs_1.default.existsSync(courseFolder)) {
            fs_1.default.rmSync(courseFolder, { recursive: true, force: true });
        }
        fs_1.default.mkdirSync(courseFolder, { recursive: true });
        const zip = new adm_zip_1.default(buffer);
        zip.extractAllTo(courseFolder, true);
        const relativeUrlPath = `/storage/scorm/${courseId}`;
        return {
            extractedPath: courseFolder,
            scormUrlPath: relativeUrlPath,
        };
    }
    static deletePackage(courseId) {
        const baseDir = this.getBaseStorageDir();
        const courseFolder = path_1.default.join(baseDir, courseId.toString());
        if (fs_1.default.existsSync(courseFolder)) {
            fs_1.default.rmSync(courseFolder, { recursive: true, force: true });
        }
    }
}
exports.ScormStorageService = ScormStorageService;
