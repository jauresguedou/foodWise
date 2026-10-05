// Stands in for `next/headers` under Vitest, where there is no request scope.
// Cookies live in one jar, like a single browser. Use with:
//   vi.mock('next/headers', () => import('./helpers/next-headers'));

type CookieOptions = {
  httpOnly?: boolean;
  sameSite?: string | boolean;
  secure?: boolean;
  maxAge?: number;
  expires?: Date;
  path?: string;
};

const jar = new Map<string, string>();
const lastSetOptions = new Map<string, CookieOptions>();

export const browser = {
  clearCookies() {
    jar.clear();
    lastSetOptions.clear();
  },
  cookieNames(): string[] {
    return [...jar.keys()];
  },
  // The options from the most recent Set-Cookie for this name.
  cookieOptions(name: string): CookieOptions | undefined {
    return lastSetOptions.get(name);
  },
};

function isExpired(options: CookieOptions | undefined): boolean {
  if (!options) return false;
  if (options.maxAge !== undefined && options.maxAge <= 0) return true;
  return options.expires !== undefined && options.expires <= new Date();
}

export async function headers(): Promise<Headers> {
  const result = new Headers();
  if (jar.size > 0) {
    result.set(
      'cookie',
      [...jar].map(([name, value]) => `${name}=${value}`).join('; ')
    );
  }
  return result;
}

export async function cookies() {
  return {
    get(name: string) {
      const value = jar.get(name);
      return value === undefined ? undefined : { name, value };
    },
    getAll() {
      return [...jar].map(([name, value]) => ({ name, value }));
    },
    has(name: string) {
      return jar.has(name);
    },
    set(name: string, value: string, options?: CookieOptions) {
      lastSetOptions.set(name, options ?? {});
      if (!value || isExpired(options)) jar.delete(name);
      else jar.set(name, value);
    },
    delete(name: string) {
      jar.delete(name);
    },
  };
}
