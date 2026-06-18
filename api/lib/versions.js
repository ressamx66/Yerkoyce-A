import { getRedis } from "./data.js";

export async function readVersions(id) {
  const redis = getRedis();
  return (await redis.get(`yerkoyce:versions:${id}`)) || [];
}

export async function saveVersion(id, data) {
  const redis = getRedis();
  const versions = await readVersions(id);
  versions.push({ id: Date.now().toString(), data });
  await redis.set(`yerkoyce:versions:${id}`, versions);
}
