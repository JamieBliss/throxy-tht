import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node", // <— you’re testing an API handler
  setupFiles: ["<rootDir>/jest.env.ts"], // <–– runs before modules load
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  extensionsToTreatAsEsm: [".ts", ".tsx", ".jsx"],
  transform: {
    // run all TS/JS/MJS through babel-jest
    "^.+\\.(t|j)sx?$": "babel-jest",
    "^.+\\.mjs$": "babel-jest",
  },
  transformIgnorePatterns: [
    // ignore everything except @google/genai
    "<rootDir>/node_modules/(?!(\\@google\\/genai)/)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testTimeout: 30000,
};

export default createJestConfig(config);
