type RuntimeEnv = Record<string, string | undefined>;

function viteEnv(): RuntimeEnv {
  return (import.meta as ImportMeta & { env?: RuntimeEnv }).env ?? {};
}

function processEnv(): RuntimeEnv {
  return (globalThis as { process?: { env?: RuntimeEnv } }).process?.env ?? {};
}

export function getEnvValue(name: string): string | undefined {
  return viteEnv()[name] ?? processEnv()[name];
}

export function isEnvFlagEnabled(name: string): boolean {
  return getEnvValue(name) === 'true';
}
