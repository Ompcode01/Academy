import fs from "fs";
import path from "path";

function findFiles(dir: string, pattern: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  try {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        results.push(...findFiles(fullPath, pattern));
      } else if (item.name.toLowerCase().includes(pattern.toLowerCase())) {
        results.push(fullPath);
      }
    }
  } catch {}
  return results;
}

console.log("=== SEARCHING DISK FOR TALENTSENSE FILES ===");
const matches = findFiles("d:\\Harbinger Training\\LMS\\LMS\\Academy", "TalentSense");
console.log("Found matches:", matches);
