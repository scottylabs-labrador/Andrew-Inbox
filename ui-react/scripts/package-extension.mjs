// Copies the built extension (ui-react/dist) into ../andrew-inbox-extension/ and
// zips it into ../andrew-inbox-extension.zip. Run with `npm run package`, which
// builds first. Uses only Node built-ins so it works the same on Windows, macOS
// and Linux.
import {
  readFileSync, readdirSync, statSync, writeFileSync, existsSync, mkdirSync, rmSync, cpSync,
} from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { deflateRawSync } from "node:zlib";

const root = resolve(import.meta.dirname, "..");
const distDir = join(root, "dist");
const outFile = resolve(root, "..", "andrew-inbox-extension.zip");
const outDir = resolve(root, "..", "andrew-inbox-extension");
// Files sit at the top of the zip (no wrapper folder): Windows "Extract All" and
// macOS both unzip into a folder named after the zip, and that folder must be
// the one containing manifest.json for "Load unpacked" to work.

const now = new Date();
const dosTime =
  (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
const dosDate =
  ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

if (!existsSync(join(distDir, "manifest.json"))) {
  console.error("dist/manifest.json not found. Run `npm run build` first.");
  process.exit(1);
}

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

const localParts = [];
const centralParts = [];
let offset = 0;

for (const file of listFiles(distDir)) {
  const name = Buffer.from(
    relative(distDir, file).split(sep).join("/"),
  );
  const data = readFileSync(file);
  const compressed = deflateRawSync(data);
  const crc = crc32(data);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); // local file header signature
  local.writeUInt16LE(20, 4); // version needed
  local.writeUInt16LE(0x0800, 6); // flags: UTF-8 names
  local.writeUInt16LE(8, 8); // method: deflate
  local.writeUInt16LE(dosTime, 10);
  local.writeUInt16LE(dosDate, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  local.writeUInt16LE(0, 28); // extra length

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0); // central directory signature
  central.writeUInt16LE(20, 4); // version made by
  central.writeUInt16LE(20, 6); // version needed
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(dosTime, 12);
  central.writeUInt16LE(dosDate, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(offset, 42); // offset of local header

  localParts.push(local, name, compressed);
  centralParts.push(central, name);
  offset += local.length + name.length + compressed.length;
}

const centralDir = Buffer.concat(centralParts);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); // end of central directory signature
end.writeUInt16LE(centralParts.length / 2, 8);
end.writeUInt16LE(centralParts.length / 2, 10);
end.writeUInt32LE(centralDir.length, 12);
end.writeUInt32LE(offset, 16);

writeFileSync(outFile, Buffer.concat([...localParts, centralDir, end]));

// Refresh the unpacked folder in place (contents only), so the folder Chrome
// already has loaded just needs a reload.
mkdirSync(outDir, { recursive: true });
for (const name of readdirSync(outDir)) {
  rmSync(join(outDir, name), { recursive: true, force: true });
}
cpSync(distDir, outDir, { recursive: true });

console.log(`\nUpdated ${outDir}`);
console.log(`Created ${outFile}`);
console.log(
  "In chrome://extensions, click the reload icon on Andrew Inbox. (First time: Developer mode -> Load unpacked -> pick the andrew-inbox-extension folder.)",
);
