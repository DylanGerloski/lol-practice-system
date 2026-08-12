'use strict';

// Minimal ZIP archive writer, "stored" (uncompressed) method only.
//
// An .xlsx file is a ZIP archive of XML parts. Node's stdlib has zlib (for
// deflate) but no archive/container writer, and the "stored" method needs no
// compression codec at all -- it just needs a correct ZIP container (local
// file headers, a central directory, and an end-of-central-directory record).
// Spreadsheet applications accept stored-method ZIPs; this trades a slightly
// larger file for a much smaller, easier-to-get-right implementation than a
// hand-rolled deflate encoder would be.
//
// No dependencies.

const CRC_TABLE = buildCrcTable();

function buildCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// DOS date/time packing used by the ZIP format. Precision to the nearest
// even second is all the format supports; that's fine for a generated file.
function dosDateTime(date) {
  const time =
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((Math.floor(date.getSeconds() / 2)) & 0x1f);
  const dosDate =
    (((date.getFullYear() - 1980) & 0x7f) << 9) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (date.getDate() & 0x1f);
  return { time, dosDate };
}

class ZipWriter {
  constructor() {
    this.entries = [];
  }

  // content: string (encoded as utf8) or Buffer
  addFile(name, content) {
    const data = Buffer.isBuffer(content) ? content : Buffer.from(String(content), 'utf8');
    this.entries.push({ name, data });
    return this;
  }

  toBuffer(date = new Date()) {
    const { time, dosDate } = dosDateTime(date);
    const localChunks = [];
    const centralChunks = [];
    let offset = 0;

    for (const entry of this.entries) {
      const nameBuf = Buffer.from(entry.name, 'utf8');
      const crc = crc32(entry.data);
      const size = entry.data.length;

      const localHeader = Buffer.alloc(30);
      localHeader.writeUInt32LE(0x04034b50, 0); // local file header signature
      localHeader.writeUInt16LE(20, 4);          // version needed to extract
      localHeader.writeUInt16LE(0, 6);           // general purpose bit flag
      localHeader.writeUInt16LE(0, 8);           // compression method: 0 = stored
      localHeader.writeUInt16LE(time, 10);
      localHeader.writeUInt16LE(dosDate, 12);
      localHeader.writeUInt32LE(crc, 14);
      localHeader.writeUInt32LE(size, 18);       // compressed size == size (stored)
      localHeader.writeUInt32LE(size, 22);       // uncompressed size
      localHeader.writeUInt16LE(nameBuf.length, 26);
      localHeader.writeUInt16LE(0, 28);          // extra field length

      localChunks.push(localHeader, nameBuf, entry.data);

      const centralHeader = Buffer.alloc(46);
      centralHeader.writeUInt32LE(0x02014b50, 0); // central directory file header signature
      centralHeader.writeUInt16LE(20, 4);          // version made by
      centralHeader.writeUInt16LE(20, 6);          // version needed to extract
      centralHeader.writeUInt16LE(0, 8);           // general purpose bit flag
      centralHeader.writeUInt16LE(0, 10);          // compression method
      centralHeader.writeUInt16LE(time, 12);
      centralHeader.writeUInt16LE(dosDate, 14);
      centralHeader.writeUInt32LE(crc, 16);
      centralHeader.writeUInt32LE(size, 20);
      centralHeader.writeUInt32LE(size, 24);
      centralHeader.writeUInt16LE(nameBuf.length, 28);
      centralHeader.writeUInt16LE(0, 30);          // extra field length
      centralHeader.writeUInt16LE(0, 32);          // file comment length
      centralHeader.writeUInt16LE(0, 34);          // disk number start
      centralHeader.writeUInt16LE(0, 36);          // internal file attributes
      centralHeader.writeUInt32LE(0, 38);          // external file attributes
      centralHeader.writeUInt32LE(offset, 42);     // relative offset of local header

      centralChunks.push(centralHeader, nameBuf);

      offset += localHeader.length + nameBuf.length + entry.data.length;
    }

    const centralDirOffset = offset;
    const centralDirSize = centralChunks.reduce((sum, buf) => sum + buf.length, 0);

    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); // end of central directory signature
    eocd.writeUInt16LE(0, 4);          // number of this disk
    eocd.writeUInt16LE(0, 6);          // disk where central directory starts
    eocd.writeUInt16LE(this.entries.length, 8);  // number of records on this disk
    eocd.writeUInt16LE(this.entries.length, 10); // total number of records
    eocd.writeUInt32LE(centralDirSize, 12);
    eocd.writeUInt32LE(centralDirOffset, 16);
    eocd.writeUInt16LE(0, 20);         // comment length

    return Buffer.concat([...localChunks, ...centralChunks, eocd]);
  }
}

// Reads a "stored"-method ZIP archive back out by parsing its end-of-central-directory
// record and central directory (not by re-scanning local headers), the same way a real
// unzip tool resolves entries -- used by the xlsx round-trip test to check what
// ZipWriter.toBuffer() actually produced, independent of the writer's own bookkeeping.
function readZipEntries(buffer) {
  const EOCD_SIG = 0x06054b50;
  const CENTRAL_SIG = 0x02014b50;
  const LOCAL_SIG = 0x04034b50;

  // The end-of-central-directory record is fixed size (22 bytes) plus an optional
  // comment at the very end of the file -- scan backward from the end to find it.
  let eocdOffset = -1;
  const minEocd = 22;
  for (let i = buffer.length - minEocd; i >= 0; i--) {
    if (buffer.readUInt32LE(i) === EOCD_SIG) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error('End of central directory record not found -- not a valid ZIP');

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirSize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirOffset = buffer.readUInt32LE(eocdOffset + 16);

  if (centralDirOffset + centralDirSize > eocdOffset) {
    throw new Error('Central directory extends past end-of-central-directory record -- malformed ZIP');
  }

  const entries = [];
  let pos = centralDirOffset;
  for (let i = 0; i < totalEntries; i++) {
    const sig = buffer.readUInt32LE(pos);
    if (sig !== CENTRAL_SIG) throw new Error(`Expected central directory signature at offset ${pos}, got 0x${sig.toString(16)}`);

    const compressionMethod = buffer.readUInt16LE(pos + 10);
    const crcExpected = buffer.readUInt32LE(pos + 16);
    const compressedSize = buffer.readUInt32LE(pos + 20);
    const uncompressedSize = buffer.readUInt32LE(pos + 24);
    const nameLen = buffer.readUInt16LE(pos + 28);
    const extraLen = buffer.readUInt16LE(pos + 30);
    const commentLen = buffer.readUInt16LE(pos + 32);
    const localHeaderOffset = buffer.readUInt32LE(pos + 42);
    const name = buffer.toString('utf8', pos + 46, pos + 46 + nameLen);

    if (compressionMethod !== 0) {
      throw new Error(`Entry ${name} uses unsupported compression method ${compressionMethod} (only stored/0 is supported)`);
    }

    // Resolve the entry's data via its local file header, per the ZIP format --
    // the central directory records where each local header starts, but the
    // actual file data begins after that local header's own name+extra fields.
    const localSig = buffer.readUInt32LE(localHeaderOffset);
    if (localSig !== LOCAL_SIG) {
      throw new Error(`Expected local file header signature for ${name} at offset ${localHeaderOffset}`);
    }
    const localNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const data = buffer.subarray(dataStart, dataStart + compressedSize);

    if (data.length !== uncompressedSize) {
      throw new Error(`Entry ${name}: stored size mismatch (expected ${uncompressedSize}, got ${data.length})`);
    }
    const actualCrc = crc32(data);
    if (actualCrc !== crcExpected) {
      throw new Error(`Entry ${name}: CRC-32 mismatch (expected ${crcExpected.toString(16)}, got ${actualCrc.toString(16)})`);
    }

    entries.push({ name, data });
    pos += 46 + nameLen + extraLen + commentLen;
  }

  return entries;
}

module.exports = { ZipWriter, readZipEntries, crc32 };
