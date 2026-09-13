import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "node:url";
import "load-env";
import logger from "logger";
import { openaiCompatibleModelsSafeParse } from "lib/ai/create-openai-compatiable";

const ROOT = process.cwd();
const FILE_NAME = "openai-compatible.config.ts";
const CONFIG_PATH = pathToFileURL(path.join(ROOT, FILE_NAME)).href;

async function load() {
  try {
    const config = await import(CONFIG_PATH).then((m) => m.default);
    return openaiCompatibleModelsSafeParse(config);
  } catch (error) {
    logger.error(error);
    return [];
  }
}

/**
 * Reads a .env file, modifies a specific key's value, and writes it back.
 *
 * Preserves comments and blank lines (and their order) so the .env file
 * stays human-editable; only the given key's line is replaced (or appended).
 *
 * @param {string} envFilePath - The absolute path to the .env file.
 * @param {string} keyToModify - The key of the variable to add or edit (e.g., 'DATA').
 * @param {string} newValue - The new value for the variable.
 * @returns {boolean} - True if successful, false otherwise.
 */
function updateEnvVariable(
  envFilePath: string,
  keyToModify: string,
  newValue: string,
): boolean {
  try {
    let envContent = "";
    if (fs.existsSync(envFilePath)) {
      envContent = fs.readFileSync(envFilePath, "utf8");
    }

    const updatedLine = `${keyToModify}=${newValue}`;
    const lines = envContent.split(/\r?\n/);
    let replaced = false;

    const newLines = lines.map((line) => {
      const trimmed = line.trim();
      if (!replaced && trimmed.length > 0 && !trimmed.startsWith("#")) {
        const eq = trimmed.indexOf("=");
        if (eq > 0 && trimmed.slice(0, eq).trim() === keyToModify) {
          replaced = true;
          return updatedLine;
        }
      }
      return line;
    });

    if (!replaced) {
      newLines.push(updatedLine);
    }

    fs.writeFileSync(envFilePath, newLines.join("\n"), "utf8");
    console.log(
      `Successfully updated ${keyToModify} in ${envFilePath} to: \n\n${newValue}\n`,
    );
    return true;
  } catch (error) {
    console.error(`Error updating .env file: ${error}`);
    return false;
  }
}

const envPath = path.join(ROOT, ".env");

const openaiCompatibleProviders = await load();

const success = updateEnvVariable(
  envPath,
  "OPENAI_COMPATIBLE_DATA",
  JSON.stringify(openaiCompatibleProviders),
);

if (success) {
  console.log("Operation completed. Check your .env file!");
} else {
  console.log("Operation failed.");
}
