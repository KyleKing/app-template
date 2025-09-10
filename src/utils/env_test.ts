import { assertEquals, assertThrows } from "@std/assert"
import { type EnvConfig, validateEnvConfig } from "@/utils/env.ts"

Deno.test("validateEnvConfig - valid config", () => {
  const config: EnvConfig = {
    NODE_ENV: "development",
    PORT: 8080,
    HOST: "localhost",
    LOG_LEVEL: "debug",
  }
  validateEnvConfig(config)
  // No error thrown
})

Deno.test("validateEnvConfig - invalid NODE_ENV", () => {
  const config: EnvConfig = {
    NODE_ENV: "invalid" as any,
    PORT: 8080,
    HOST: "localhost",
    LOG_LEVEL: "debug",
  }
  assertThrows(() => validateEnvConfig(config), Error, "Invalid NODE_ENV: invalid")
})

Deno.test("validateEnvConfig - invalid PORT", () => {
  const config: EnvConfig = {
    NODE_ENV: "development",
    PORT: 0,
    HOST: "localhost",
    LOG_LEVEL: "debug",
  }
  assertThrows(() => validateEnvConfig(config), Error, "Invalid PORT: 0")
})

Deno.test("validateEnvConfig - empty HOST", () => {
  const config: EnvConfig = {
    NODE_ENV: "development",
    PORT: 8080,
    HOST: "",
    LOG_LEVEL: "debug",
  }
  assertThrows(() => validateEnvConfig(config), Error, "HOST cannot be empty")
})

Deno.test("validateEnvConfig - invalid LOG_LEVEL", () => {
  const config: EnvConfig = {
    NODE_ENV: "development",
    PORT: 8080,
    HOST: "localhost",
    LOG_LEVEL: "invalid" as any,
  }
  assertThrows(() => validateEnvConfig(config), Error, "Invalid LOG_LEVEL: invalid")
})

Deno.test("validateEnvConfig - multiple errors", () => {
  const config: EnvConfig = {
    NODE_ENV: "invalid" as any,
    PORT: 0,
    HOST: "",
    LOG_LEVEL: "invalid" as any,
  }
  assertThrows(() => validateEnvConfig(config), Error, "Environment configuration errors:")
})
