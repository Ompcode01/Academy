"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Script to convert all existing PPTX files in storage/uploads to PDF
 * Run with: npx ts-node src/scripts/convertExistingPptx.ts
 */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function main() {
    const { convert } = require("pptx-to-pdf");
    const uploadsDir = path_1.default.join(process.cwd(), "public", "storage", "uploads");
    if (!fs_1.default.existsSync(uploadsDir)) {
        console.log("No uploads directory found.");
        return;
    }
    const files = fs_1.default.readdirSync(uploadsDir);
    const pptxFiles = files.filter((f) => f.toLowerCase().endsWith(".pptx"));
    console.log(`Found ${pptxFiles.length} PPTX files to convert.`);
    for (const file of pptxFiles) {
        const pdfName = file.replace(/\.pptx$/i, ".converted.pdf");
        const pdfPath = path_1.default.join(uploadsDir, pdfName);
        // Skip if already converted
        if (fs_1.default.existsSync(pdfPath)) {
            console.log(`  Already converted: ${file} -> ${pdfName}`);
            continue;
        }
        try {
            console.log(`  Converting: ${file}...`);
            const buffer = fs_1.default.readFileSync(path_1.default.join(uploadsDir, file));
            const pdfBuffer = await convert(buffer);
            fs_1.default.writeFileSync(pdfPath, pdfBuffer);
            console.log(`  Converted: ${file} -> ${pdfName} (${(pdfBuffer.length / 1024).toFixed(0)} KB)`);
        }
        catch (err) {
            console.error(`  Failed to convert ${file}:`, err);
        }
    }
    console.log("\nDone!");
}
main().catch(console.error);
