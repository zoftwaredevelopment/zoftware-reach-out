import { createBrowserClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === "undefined") return undefined;
          const escapedName = name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1");
          const match = document.cookie.match(
            `(?:^|; )${escapedName}=([^;]*)`
          );
          return match ? decodeURIComponent(match[1]) : undefined;
        },
        set(name: string, value: string, options: CookieOptions) {
          if (typeof document === "undefined") return;
          let cookieString = `${name}=${encodeURIComponent(value)}`;
          if (options.maxAge) cookieString += `; Max-Age=${options.maxAge}`;
          if (options.path) cookieString += `; Path=${options.path}`;
          if (options.domain) cookieString += `; Domain=${options.domain}`;
          if (options.expires)
            cookieString += `; Expires=${options.expires.toUTCString()}`;
          if (options.httpOnly) cookieString += "; HttpOnly";
          if (options.secure) cookieString += "; Secure";
          if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`;
          document.cookie = cookieString;
        },
        remove(name: string, options: CookieOptions) {
          if (typeof document === "undefined") return;
          let cookieString = `${name}=; Max-Age=0`;
          if (options.path) cookieString += `; Path=${options.path}`;
          if (options.domain) cookieString += `; Domain=${options.domain}`;
          document.cookie = cookieString;
        },
      },
    }
  );
}