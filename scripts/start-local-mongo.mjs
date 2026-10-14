import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const port = 27018;
const replicaSet = "mmm_local";
const host = `127.0.0.1:${port}`;
const localRoot = path.join(process.cwd(), ".local", "mongodb");
const dataPath = path.join(localRoot, "data");
const logPath = path.join(localRoot, "mongod.log");
const adminUri = `mongodb://${host}/admin?directConnection=true`;

function findMongod() {
  if (process.env.MONGOD_BIN) return process.env.MONGOD_BIN;
  if (process.platform !== "win32") return "mongod";
  const serverRoot = path.join(
    process.env.ProgramFiles ?? "C:\\Program Files",
    "MongoDB",
    "Server",
  );
  if (!existsSync(serverRoot)) throw new Error("MongoDB Server is not installed.");
  const versions = readdirSync(serverRoot).sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true }),
  );
  const binary = versions
    .map((version) => path.join(serverRoot, version, "bin", "mongod.exe"))
    .find(existsSync);
  if (!binary) throw new Error("MongoDB Server executable was not found.");
  return binary;
}

async function withAdmin(callback) {
  const connection = mongoose.createConnection(adminUri, { serverSelectionTimeoutMS: 1000 });
  try {
    await connection.asPromise();
    return await callback(connection.db.admin());
  } finally {
    await connection.close().catch(() => {});
  }
}

async function hello() {
  try {
    return await withAdmin((admin) => admin.command({ hello: 1 }));
  } catch {
    return null;
  }
}

let state = await hello();
if (!state) {
  mkdirSync(dataPath, { recursive: true });
  const child = spawn(
    findMongod(),
    [
      "--dbpath",
      dataPath,
      "--port",
      String(port),
      "--bind_ip",
      "127.0.0.1",
      "--replSet",
      replicaSet,
      "--logpath",
      logPath,
      "--logappend",
    ],
    { detached: true, stdio: "ignore", windowsHide: true },
  );
  child.unref();
  for (let attempt = 0; attempt < 20 && !state; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    state = await hello();
  }
}

if (!state) throw new Error(`Local MongoDB did not start. Check ${logPath}.`);
const options = await withAdmin((admin) => admin.command({ getCmdLineOpts: 1 }));
const runningDataPath = options.parsed?.storage?.dbPath;
const normalizePath = (value) => {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
};
if (!runningDataPath || normalizePath(runningDataPath) !== normalizePath(dataPath)) {
  throw new Error(
    `Port ${port} belongs to a MongoDB server outside this project's data directory.`,
  );
}
if (state.setName && state.setName !== replicaSet) {
  throw new Error(`Port ${port} belongs to another MongoDB replica set.`);
}
if (!state.setName) {
  await withAdmin((admin) =>
    admin.command({
      replSetInitiate: { _id: replicaSet, members: [{ _id: 0, host }] },
    }),
  );
}
for (let attempt = 0; attempt < 30; attempt++) {
  state = await hello();
  if (state?.setName === replicaSet && state.isWritablePrimary) {
    console.log(`Local MongoDB replica set ${replicaSet} is ready on ${host}.`);
    process.exit(0);
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}
throw new Error(`Local MongoDB did not become ready. Check ${logPath}.`);
