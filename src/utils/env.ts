export interface EnvConfig {
  NODE_ENV: "development" | "production" | "test"
  PORT: number
  HOST: string
  LOG_LEVEL: "trace" | "debug" | "info" | "warning" | "error" | "fatal"
}

export function getEnvConfig(): EnvConfig {
  const isProduction = Deno.env.get("NODE_ENV") === "production"

  return {
    NODE_ENV: (Deno.env.get("NODE_ENV") as EnvConfig["NODE_ENV"]) || "development",
    PORT: parseInt(Deno.env.get("PORT") || (isProduction ? "8000" : "8080")),
    HOST: Deno.env.get("HOST") || (isProduction ? "0.0.0.0" : "localhost"),
    LOG_LEVEL: (Deno.env.get("LOG_LEVEL") as EnvConfig["LOG_LEVEL"]) || (isProduction ? "info" : "debug"),
  }
}

export function validateEnvConfig(config: EnvConfig): void {
  const errors: string[] = []

  if (!["development", "production", "test"].includes(config.NODE_ENV)) {
    errors.push(`Invalid NODE_ENV: ${config.NODE_ENV}`)
  }

  if (isNaN(config.PORT) || config.PORT < 1 || config.PORT > 65535) {
    errors.push(`Invalid PORT: ${config.PORT}`)
  }

  if (!config.HOST) {
    errors.push("HOST cannot be empty")
  }

  if (!["trace", "debug", "info", "warning", "error", "fatal"].includes(config.LOG_LEVEL)) {
    errors.push(`Invalid LOG_LEVEL: ${config.LOG_LEVEL}`)
  }

  if (errors.length > 0) {
    throw new Error(`Environment configuration errors:\n${errors.join("\n")}`)
  }
}
