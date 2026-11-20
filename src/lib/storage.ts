import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const driver = (process.env.STORAGE_DRIVER ?? "local").toLowerCase();
const localRoot = path.join(process.cwd(), "storage", "uploads");

function s3Client() {
  return new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
  });
}

function bucket() {
  const b = process.env.S3_BUCKET;
  if (!b) throw new Error("S3_BUCKET belum dikonfigurasi");
  return b;
}

function safeLocalPath(key: string) {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  const resolved = path.resolve(localRoot, normalized);
  if (!resolved.startsWith(path.resolve(localRoot) + path.sep)) {
    throw new Error("Path tidak valid");
  }
  return resolved;
}

function supabaseStorageConfig() {
  const base = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!base || !serviceKey) throw new Error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi");
  return { base, serviceKey, bucket: process.env.SUPABASE_STORAGE_BUCKET || "attachments" };
}

async function supabaseStorageFetch(requestPath: string, method: string, headers: Record<string, string> = {}, body?: BodyInit) {
  const { base, serviceKey } = supabaseStorageConfig();
  const res = await fetch(`${base}/storage/v1/${requestPath}`, {
    method,
    headers: { Authorization: `Bearer ${serviceKey}`, ...headers },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Supabase storage ${res.status}: ${await res.text()}`);
  }
  return res;
}

function storageObjectPath(key: string) {
  const { bucket: bucketName } = supabaseStorageConfig();
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `object/${bucketName}/${encodedKey}`;
}

export function storageDriver() {
  if (driver === "s3") return "s3";
  if (driver === "supabase") return "supabase";
  return "local";
}

export async function putObject(key: string, body: Buffer, contentType?: string) {
  const active = storageDriver();
  if (active === "s3") {
    await s3Client().send(
      new PutObjectCommand({
        Bucket: bucket(),
        Key: key,
        Body: body,
        ContentType: contentType || "application/octet-stream",
      }),
    );
    return;
  }
  if (active === "supabase") {
    await supabaseStorageFetch(
      storageObjectPath(key),
      "POST",
      {
        "Content-Type": contentType || "application/octet-stream",
        "cache-control": "3600",
        "x-upsert": "true",
      },
      new Uint8Array(body),
    );
    return;
  }
  const filePath = safeLocalPath(key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, body);
}

export async function getObjectBytes(key: string) {
  const active = storageDriver();
  if (active === "s3") {
    const res = await s3Client().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) throw new Error("Objek tidak ditemukan");
    return { bytes, contentType: res.ContentType ?? "application/octet-stream" };
  }
  if (active === "supabase") {
    const res = await supabaseStorageFetch(storageObjectPath(key), "GET");
    return {
      bytes: new Uint8Array(await res.arrayBuffer()),
      contentType: res.headers.get("content-type") ?? undefined,
    };
  }
  const filePath = safeLocalPath(key);
  return { bytes: await readFile(filePath), contentType: undefined as string | undefined };
}

export async function deleteObject(key: string) {
  const active = storageDriver();
  if (active === "s3") {
    await s3Client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
    return;
  }
  if (active === "supabase") {
    await supabaseStorageFetch(storageObjectPath(key), "DELETE").catch(() => undefined);
    return;
  }
  await unlink(safeLocalPath(key)).catch(() => undefined);
}

/** URL sementara untuk mengunduh objek privat (khusus S3). */
export async function signedDownloadUrl(key: string) {
  if (storageDriver() === "s3") {
    return getSignedUrl(s3Client(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn: 600 });
  }
  return null;
}
