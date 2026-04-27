import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

const COOKIE_NAME = "olj_session";
const ALG = "HS256";

export type EdgeSession = {
  sub: string;
  email: string;
  name: string | null;
};

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) return null;
  return new TextEncoder().encode(secret);
}

export async function getSessionFromRequest(req: NextRequest): Promise<EdgeSession | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const secret = getSecret();
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: [ALG] });
    if (typeof payload.sub !== "string") return null;
    return {
      sub: payload.sub,
      email: (payload.email as string) ?? "",
      name: (payload.name as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
