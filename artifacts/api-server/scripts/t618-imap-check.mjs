// Task-618 harness: search the site's IMAP-readable sender inbox for messages
// containing a marker string and print decoded headers/body text + image URLs.
import tls from "node:tls";
const USER = "leasingexhibit@highlandptrs.com";
const PASS = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s+/g, "");
const NEEDLE = process.argv[2];
const sock = tls.connect(993, "imap.gmail.com", { servername: "imap.gmail.com" });
let buf = "";
let tag = 0;
const pending = [];
sock.on("data", (d) => {
  buf += d.toString("binary");
  while (pending.length) {
    const { t, resolve } = pending[0];
    const re = new RegExp(`\\r\\nA${t} (OK|NO|BAD)[^\\r\\n]*\\r\\n`);
    const m = buf.match(re);
    if (!m) break;
    const idx = buf.indexOf(m[0]) + m[0].length;
    resolve(buf.slice(0, idx));
    buf = buf.slice(idx);
    pending.shift();
  }
});
function cmd(c) {
  tag += 1;
  const t = tag;
  return new Promise((r) => {
    pending.push({ t, resolve: r });
    sock.write(`A${t} ${c}\r\n`);
  });
}
await new Promise((r) => sock.once("secureConnect", r));
await new Promise((r) => setTimeout(r, 500));
buf = "";
await cmd(`LOGIN "${USER}" "${PASS}"`);
await cmd(`SELECT INBOX`);
const search = await cmd(`UID SEARCH TEXT "${NEEDLE}"`);
const uids = (search.match(/\* SEARCH ([\d ]+)/)?.[1] ?? "").trim().split(/\s+/).filter(Boolean);
console.log("uids:", uids);
for (const uid of uids) {
  const hdr = await cmd(`UID FETCH ${uid} (BODY.PEEK[HEADER.FIELDS (FROM TO SUBJECT DATE)])`);
  console.log("=== UID", uid, "===\n", hdr.replace(/\r/g, ""));
  const body = await cmd(`UID FETCH ${uid} (BODY.PEEK[TEXT])`);
  const qp = body.replace(/=\r\n/g, "").replace(/=([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  // Also decode any base64 text parts.
  let txt = qp;
  for (const p of body.split(/Content-Transfer-Encoding: base64/i).slice(1)) {
    const b64 = (p.match(/\r\n\r\n([A-Za-z0-9+/=\r\n]+)/)?.[1] ?? "").replace(/\s+/g, "");
    if (b64.length > 40) txt += "\n" + Buffer.from(b64, "base64").toString("utf8");
  }
  const stripped = txt
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
  console.log(stripped.slice(0, 2500));
  const imgs = [...txt.matchAll(/https?:\/\/[^"'\s>]+\.(?:png|jpg|jpeg|gif)[^"'\s>]*/gi)].map((m) => m[0]);
  console.log("IMAGES:", [...new Set(imgs)].slice(0, 10));
}
await cmd("LOGOUT");
sock.end();
