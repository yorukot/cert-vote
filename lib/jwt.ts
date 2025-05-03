import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { UserModel } from "@/lib/db/models/user";
import { PollModel } from "@/lib/db/models/poll";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const issuer = process.env.JWT_ISSUER || "cert-vote";

export interface VerificationPayload extends JWTPayload {
  pollId: string;
}

export async function issueJwt(user: UserModel, poll: PollModel) {
  const jwt = await new SignJWT({ pollId: poll.pollId })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt() // iat
    .setIssuer(issuer) // iss
    .setAudience(user.userId) // aud
    .setExpirationTime("2h") // exp (2 小時後)
    .sign(secret);

  return jwt;
}

export async function verifyJwt(token: string, user: UserModel): Promise<VerificationPayload> {
  try {
    const { payload, protectedHeader } = await jwtVerify<VerificationPayload>(token, secret, {
      issuer: issuer,
      audience: user.userId,
    });

    return payload;
  } catch (err) {
    console.error("驗證失敗：", err);
    throw err;
  }
}
