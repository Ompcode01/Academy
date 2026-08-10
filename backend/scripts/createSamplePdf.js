const fs = require("fs");
const path = require("path");

// Minimal valid PDF binary generator
function generateMinimalPdf() {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 6 0 R >>
endobj
4 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 7 0 R >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Length 174 >>
stream
BT
/F1 24 Tf
50 720 Td
(Harbinger Academy - Course Manual) Tj
/F1 14 Tf
0 -40 Td
(Page 1: Introduction & Module Objectives) Tj
0 -30 Td
(Welcome to the AI Fundamentals Training Course.) Tj
0 -25 Td
(Scroll down to read additional chapters and guidelines.) Tj
ET
endstream
endobj
7 0 obj
<< /Length 160 >>
stream
BT
/F1 24 Tf
50 720 Td
(Chapter 1: AI Concepts & Models) Tj
/F1 14 Tf
0 -40 Td
(Page 2: Core Architecture & Neural Networks) Tj
0 -30 Td
(Key topics include Supervised Learning and Deep Learning.) Tj
ET
endstream
endobj
xref
0 8
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000236 00000 n 
0000000357 00000 n 
0000000428 00000 n 
0000000653 00000 n 
trailer
<< /Size 8 /Root 1 0 R >>
startxref
0000000864
%%EOF`;

  return Buffer.from(content);
}

const targetDir = path.join(__dirname, "..", "public", "storage");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const pdfPath = path.join(targetDir, "sample_course_manual.pdf");
fs.writeFileSync(pdfPath, generateMinimalPdf());
console.log("Sample PDF created successfully at:", pdfPath);
