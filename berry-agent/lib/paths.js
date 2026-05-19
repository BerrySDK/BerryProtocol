import path from "node:path";

export function createPaths(baseDir) {
  return {
    baseDir,
    localDataDir: path.join(baseDir, "data"),
    rootDataDir: path.resolve(baseDir, "..", "data"),
    generatedDir: path.join(baseDir, "generated"),
    promptsDir: path.join(baseDir, "prompts"),
    playbooksDir: path.join(baseDir, "playbooks"),
  };
}
