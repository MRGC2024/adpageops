import { Injectable } from "@nestjs/common";
import * as nacl from "tweetnacl";

const NONCE_LENGTH = 24;
const KEY_LENGTH = 32;

function utf8Encode(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}
function utf8Decode(b: Uint8Array): string {
  return new TextDecoder().decode(b);
}
function b64Encode(b: Uint8Array): string {
  return Buffer.from(b).toString("base64");
}
function b64Decode(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s, "base64"));
}

/** Encrypt access_token at rest. Never log plain tokens. */
@Injectable()
export class TokenEncryptionService {
  private key: Uint8Array;

  constructor() {
    const secret = process.env.ENCRYPTION_KEY || process.env.TOKEN_ENCRYPTION_KEY || "adpageops-default-32-byte-key!!";
    const key = utf8Encode(secret.padEnd(KEY_LENGTH).slice(0, KEY_LENGTH));
    this.key = new Uint8Array(KEY_LENGTH);
    for (let i = 0; i < KEY_LENGTH; i++) this.key[i] = key[i] ?? 0;
  }

  encrypt(plain: string): string {
    const nonce = nacl.randomBytes(NONCE_LENGTH);
    const msg = utf8Encode(plain);
    const box = nacl.secretbox(msg, nonce, this.key);
    const combined = new Uint8Array(nonce.length + box.length);
    combined.set(nonce);
    combined.set(box, nonce.length);
    return b64Encode(combined);
  }

  decrypt(cipher: string): string {
    const combined = b64Decode(cipher);
    const nonce = combined.slice(0, NONCE_LENGTH);
    const box = combined.slice(NONCE_LENGTH);
    const out = nacl.secretbox.open(box, nonce, this.key);
    if (!out) throw new Error("Decryption failed");
    return utf8Decode(out);
  }
}
