import { JWTPayload, jwtVerify, SignJWT } from "jose";
import user, { UserModel } from "@/lib/db/models/user";
import { PollModel } from "@/lib/db/models/poll";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const issuer = process.env.JWT_ISSUER || "cert-vote";

export interface VerificationPayload extends JWTPayload {
  pollId: string;
}

export async function issueJwt(poll: PollModel) {
  const jwt = await new SignJWT({ pollId: poll.pollId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt() // iat
    .setIssuer(issuer) // iss
    .setExpirationTime("1m") // exp (1 minute)
    .sign(secret);

  return jwt;
}

export async function verifyJwt(token: string): Promise<VerificationPayload> {
  try {
    const { payload, protectedHeader } = await jwtVerify<VerificationPayload>(token, secret, {
      issuer: issuer,
      algorithms: ["HS256"],
    });

    return payload;
  } catch (err) {
    console.error("驗證失敗：", err);
    throw err;
  }
}
