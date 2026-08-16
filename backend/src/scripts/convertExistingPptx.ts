/**
 * Script to convert all existing PPTX files in storage/uploads to PDF
 * Run with: npx ts-node src/scripts/convertExistingPptx.ts
 */
import fs from "fs";
import path from "path";

async function main() {
  const { convert } = require("pptx-to-pdf");

  const uploadsDir = path.join(process.cwd(), "public", "storage", "uploads");

  if (!fs.existsSync(uploadsDir)) {
    console.log("No uploads directory found.");
    return;
  }

  const files = fs.readdirSync(uploadsDir);
  const pptxFiles = files.filter((f) => f.toLowerCase().endsWith(".pptx"));

  console.log(`Found ${pptxFiles.length} PPTX files to convert.`);

  for (const file of pptxFiles) {
    const pdfName = file.replace(/\.pptx$/i, ".converted.pdf");
    const pdfPath = path.join(uploadsDir, pdfName);

    // Skip if already converted
    if (fs.existsSync(pdfPath)) {
      console.log(`  Already converted: ${file} -> ${pdfName}`);
      continue;
    }

    try {
      console.log(`  Converting: ${file}...`);
      const buffer = fs.readFileSync(path.join(uploadsDir, file));
      const pdfBuffer = await convert(buffer);
      fs.writeFileSync(pdfPath, pdfBuffer);
      console.log(`  Converted: ${file} -> ${pdfName} (${(pdfBuffer.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.error(`  Failed to convert ${file}:`, err);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
