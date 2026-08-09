"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScormValidationService = void 0;
const adm_zip_1 = __importDefault(require("adm-zip"));
const path_1 = __importDefault(require("path"));
class ScormValidationService {
    static validateZipBuffer(buffer) {
        const errors = [];
        let zip;
        try {
            zip = new adm_zip_1.default(buffer);
        }
        catch (err) {
            return {
                isValid: false,
                version: "Unknown",
                title: "",
                itemCount: 0,
                launchFile: "",
                manifestPath: "",
                errors: ["Invalid or corrupted ZIP package archive."],
            };
        }
        const zipEntries = zip.getEntries();
        if (!zipEntries || zipEntries.length === 0) {
            return {
                isValid: false,
                version: "Unknown",
                title: "",
                itemCount: 0,
                launchFile: "",
                manifestPath: "",
                errors: ["Uploaded ZIP archive is empty."],
            };
        }
        // Security check: Check path traversal vulnerabilities
        for (const entry of zipEntries) {
            if (entry.entryName.includes("..")) {
                return {
                    isValid: false,
                    version: "Unknown",
                    title: "",
                    itemCount: 0,
                    launchFile: "",
                    manifestPath: "",
                    errors: ["Security Error: Zip file contains illegal relative path traversal ('..')."],
                };
            }
        }
        // Find imsmanifest.xml
        let manifestEntry = zipEntries.find((entry) => entry.entryName.toLowerCase() === "imsmanifest.xml");
        let relativePrefix = "";
        if (!manifestEntry) {
            // Check if it's nested inside a single root folder
            manifestEntry = zipEntries.find((entry) => entry.entryName.toLowerCase().endsWith("/imsmanifest.xml"));
            if (manifestEntry) {
                relativePrefix = manifestEntry.entryName.substring(0, manifestEntry.entryName.toLowerCase().indexOf("imsmanifest.xml"));
            }
        }
        if (!manifestEntry) {
            return {
                isValid: false,
                version: "Unknown",
                title: "",
                itemCount: 0,
                launchFile: "",
                manifestPath: "",
                errors: ["Missing imsmanifest.xml file in the package root."],
            };
        }
        const manifestXmlText = manifestEntry.getData().toString("utf-8");
        if (!manifestXmlText || manifestXmlText.trim().length === 0) {
            return {
                isValid: false,
                version: "Unknown",
                title: "",
                itemCount: 0,
                launchFile: "",
                manifestPath: manifestEntry.entryName,
                errors: ["imsmanifest.xml is empty or unreadable."],
            };
        }
        // Extract SCORM version from XML
        let version = "1.2";
        if (manifestXmlText.includes("<schemaversion>1.2</schemaversion>") ||
            manifestXmlText.includes("CAM 1.2") ||
            manifestXmlText.includes("1.2")) {
            version = "1.2";
        }
        else if (manifestXmlText.includes("<schemaversion>2004") ||
            manifestXmlText.includes("CAM 1.3") ||
            manifestXmlText.includes("2004")) {
            version = "2004";
        }
        // Extract Title from <title> tag inside <organization>
        let title = "SCORM Course Package";
        const titleMatch = manifestXmlText.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].trim();
        }
        // Extract item count (number of <item> elements)
        const itemsMatches = manifestXmlText.match(/<item[\s>]/gi);
        const itemCount = itemsMatches ? itemsMatches.length : 1;
        // Extract launch/entry file from <resource> tag with href
        let launchFile = "";
        // 1. Try finding resource referenced by an item identifierref
        const itemMatch = manifestXmlText.match(/<item[^>]*identifierref=["']([^"']+)["']/i);
        if (itemMatch && itemMatch[1]) {
            const refId = itemMatch[1];
            const resourceRegex = new RegExp(`<resource[^>]*identifier=["']${refId}["'][^>]*href=["']([^"']+)["']`, "i");
            const resMatch = manifestXmlText.match(resourceRegex);
            if (resMatch && resMatch[1]) {
                launchFile = resMatch[1];
            }
        }
        // 2. Fallback: Find first <resource> tag with href attribute
        if (!launchFile) {
            const hrefMatch = manifestXmlText.match(/<resource[^>]*href=["']([^"']+)["']/i);
            if (hrefMatch && hrefMatch[1]) {
                launchFile = hrefMatch[1];
            }
        }
        // 3. Fallback: Check common entry file names in ZIP
        if (!launchFile) {
            const commonEntries = ["index.html", "index.htm", "story.html", "launch.html", "player.html"];
            for (const common of commonEntries) {
                const found = zipEntries.find((e) => e.entryName.toLowerCase() === (relativePrefix + common).toLowerCase());
                if (found) {
                    launchFile = common;
                    break;
                }
            }
        }
        if (!launchFile) {
            errors.push("Could not determine valid SCORM launch/entry file from manifest resources.");
        }
        else {
            // Verify launch file exists inside ZIP archive
            const targetPath = (relativePrefix + launchFile).toLowerCase();
            const launchEntryExists = zipEntries.some((e) => e.entryName.toLowerCase() === targetPath || e.entryName.toLowerCase().endsWith(launchFile.toLowerCase()));
            if (!launchEntryExists) {
                errors.push(`Launch file '${launchFile}' specified in imsmanifest.xml does not exist in package.`);
            }
        }
        // Clean launch file path relative to extracted folder
        launchFile = relativePrefix ? path_1.default.join(relativePrefix, launchFile).replace(/\\/g, "/") : launchFile;
        const isValid = errors.length === 0;
        return {
            isValid,
            version,
            title,
            itemCount,
            launchFile,
            manifestPath: manifestEntry.entryName,
            errors,
        };
    }
}
exports.ScormValidationService = ScormValidationService;
