import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const replacements = [
  ["_reference_baileys2/lib/Signal/libsignal.js", "libsignal/src/protobufs", "libsignal/src/protobufs.js"],
  ["_reference_baileys2/lib/Utils/crypto.js", "libsignal/src/curve", "libsignal/src/curve.js"],
  ["_reference_baileys2/lib/Signal/Group/group_cipher.js", "libsignal/src/crypto", "libsignal/src/crypto.js"],
  ["_reference_baileys2/lib/Signal/Group/keyhelper.js", "libsignal/src/curve", "libsignal/src/curve.js"],
  ["_reference_baileys2/lib/Signal/Group/sender-chain-key.js", "libsignal/src/crypto", "libsignal/src/crypto.js"],
  ["_reference_baileys2/lib/Signal/Group/sender-key-message.js", "libsignal/src/curve", "libsignal/src/curve.js"],
  ["_reference_baileys2/lib/Signal/Group/sender-message-key.js", "libsignal/src/crypto", "libsignal/src/crypto.js"],
];

for (const [relativePath, from, to] of replacements) {
  const filePath = resolve(relativePath);
  const source = await readFile(filePath, "utf8");
  const next = source.replaceAll(from, to);
  if (next !== source) {
    await writeFile(filePath, next, "utf8");
  }
}

console.log("Patched Baileys ESM imports.");
