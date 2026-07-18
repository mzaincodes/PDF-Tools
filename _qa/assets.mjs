// Generates sample files used by the QA harness. Run from the project root.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { PDFDocument as Cantoo } from "@cantoo/pdf-lib";
import JSZip from "jszip";

const DIR = path.resolve("_qa/assets");
fs.mkdirSync(DIR, { recursive: true });
const w = (name, data) => {
  fs.writeFileSync(path.join(DIR, name), data);
  console.log("  wrote", name, `(${data.length} bytes)`);
};

/* ---------------- minimal PNG encoder ---------------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function makePng(width, height, pixel) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  let p = 0;
  for (let y = 0; y < height; y++) {
    raw[p++] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixel(x, y);
      raw[p++] = r; raw[p++] = g; raw[p++] = b; raw[p++] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

async function main() {
  console.log("Generating QA assets…");

  const png = makePng(240, 160, (x, y) => [
    Math.round((x / 240) * 255),
    Math.round((y / 160) * 255),
    180,
    255,
  ]);
  w("photo.png", png);

  /* sample.pdf — 5 pages, text + an embedded image on page 1 */
  {
    const doc = await PDFDocument.create();
    doc.setTitle("QA Sample Document");
    doc.setAuthor("QA Bot");
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const img = await doc.embedPng(png);
    for (let i = 0; i < 5; i++) {
      const page = doc.addPage([595.28, 841.89]);
      page.drawText(`Sample Document Page ${i + 1}`, { x: 60, y: 760, size: 28, font, color: rgb(0.1, 0.1, 0.2) });
      page.drawText(`The quick brown fox jumps over the lazy dog. Line for page ${i + 1}.`, {
        x: 60, y: 710, size: 13, font, color: rgb(0.25, 0.25, 0.3),
      });
      if (i === 0) page.drawImage(img, { x: 60, y: 500, width: 240, height: 160 });
    }
    w("sample.pdf", Buffer.from(await doc.save()));
  }

  /* sample2.pdf — 3 pages */
  {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (let i = 0; i < 3; i++) {
      const page = doc.addPage([595.28, 841.89]);
      page.drawText(`Second Document Page ${i + 1}`, { x: 60, y: 760, size: 26, font });
      page.drawText(`Unique second-doc line ${i + 1} for diffing.`, { x: 60, y: 710, size: 13, font });
    }
    w("sample2.pdf", Buffer.from(await doc.save()));
  }

  /* form.pdf — interactive form fields */
  {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText("QA Form", { x: 60, y: 760, size: 24, font });
    const form = doc.getForm();
    const name = form.createTextField("qa.name");
    name.setText("Prefilled Name");
    name.addToPage(page, { x: 60, y: 690, width: 300, height: 26 });
    const agree = form.createCheckBox("qa.agree");
    agree.check();
    agree.addToPage(page, { x: 60, y: 640, width: 20, height: 20 });
    w("form.pdf", Buffer.from(await doc.save()));
  }

  /* protected.pdf — encrypted with password "test123" */
  {
    const doc = await Cantoo.create();
    const page = doc.addPage([595.28, 841.89]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText("Locked Document", { x: 60, y: 760, size: 24, font });
    page.drawText("This file is password protected.", { x: 60, y: 720, size: 13, font });
    doc.encrypt({ userPassword: "test123", ownerPassword: "test123" });
    w("protected.pdf", Buffer.from(await doc.save()));
  }

  /* doc.docx */
  {
    const zip = new JSZip();
    zip.file(
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`
    );
    zip.file(
      "_rels/.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`
    );
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>QA Word Heading</w:t></w:r></w:p><w:p><w:r><w:t>First paragraph of the sample Word document used for conversion testing.</w:t></w:r></w:p><w:p><w:r><w:t>Second paragraph with more text so the PDF has content to lay out.</w:t></w:r></w:p></w:body></w:document>`
    );
    w("doc.docx", await zip.generateAsync({ type: "nodebuffer" }));
  }

  /* book.xlsx */
  {
    const zip = new JSZip();
    zip.file(
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/></Types>`
    );
    zip.file(
      "xl/sharedStrings.xml",
      `<?xml version="1.0" encoding="UTF-8"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="4" uniqueCount="4"><si><t>Product</t></si><si><t>Price</t></si><si><t>Widget</t></si><si><t>Gadget</t></si></sst>`
    );
    zip.file(
      "xl/worksheets/sheet1.xml",
      `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>9.99</v></c></row><row r="3"><c r="A3" t="s"><v>3</v></c><c r="B3"><v>19.5</v></c></row></sheetData></worksheet>`
    );
    w("book.xlsx", await zip.generateAsync({ type: "nodebuffer" }));
  }

  /* deck.pptx */
  {
    const zip = new JSZip();
    zip.file(
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/></Types>`
    );
    const slide = (n, title) =>
      `<?xml version="1.0" encoding="UTF-8"?><p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>${title}</a:t></a:r></a:p><a:p><a:r><a:t>Bullet point one on slide ${n}.</a:t></a:r></a:p><a:p><a:r><a:t>Bullet point two on slide ${n}.</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`;
    zip.file("ppt/slides/slide1.xml", slide(1, "QA Deck Title"));
    zip.file("ppt/slides/slide2.xml", slide(2, "Second Slide"));
    w("deck.pptx", await zip.generateAsync({ type: "nodebuffer" }));
  }

  /* heavy.pdf — image-heavy, the realistic case for compression */
  {
    const big = makePng(1400, 1000, (x, y) => [
      (x * 7 + y * 3) % 256,
      (y * 5) % 256,
      (x * 3) % 256,
      255,
    ]);
    const doc = await PDFDocument.create();
    const img = await doc.embedPng(big);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (let i = 0; i < 3; i++) {
      const page = doc.addPage([595.28, 841.89]);
      page.drawImage(img, { x: 0, y: 300, width: 595.28, height: 425 });
      page.drawText(`Heavy scanned-style page ${i + 1}`, { x: 60, y: 200, size: 20, font });
    }
    w("heavy.pdf", Buffer.from(await doc.save()));
  }

  /* sample-copy.pdf — identical twin of sample.pdf, for the compare tool */
  fs.copyFileSync(path.join(DIR, "sample.pdf"), path.join(DIR, "sample-copy.pdf"));
  console.log("  wrote sample-copy.pdf (copy of sample.pdf)");

  /* page.html */
  w(
    "page.html",
    Buffer.from(
      `<!DOCTYPE html><html><head><title>QA HTML Page</title></head><body><h1>QA HTML Heading</h1><p>This paragraph should end up in the generated PDF.</p><ul><li>List item one</li><li>List item two</li></ul><p>Closing paragraph of the HTML sample.</p></body></html>`
    )
  );

  console.log("Done. Assets in", DIR);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
