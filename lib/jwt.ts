import { exportPKCS8, exportSPKI, generateKeyPair, jwtVerify, SignJWT } from "jose";
import { UserModel } from "@/lib/db/models/user";
import { PollModel } from "@/lib/db/models/poll";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const issuer = process.env.JWT_ISSUER || "cert-vote";

type Payload = {
  pollId: string;
};

async function issueJwt(user: UserModel, poll: PollModel) {
  const jwt = await new SignJWT({ pollId: poll.pollId })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt() // iat
    .setIssuer(issuer) // iss
    .setAudience(user.userId) // aud
    .setExpirationTime("2h") // exp (2 小時後)
    .sign(secret);

  console.log("Issued JWT:", jwt);
  return jwt;
}

async function verifyJwt(token: string, user: UserModel) {
  try {
    const { payload, protectedHeader } = await jwtVerify(token, secret, {
      issuer: issuer,
      audience: user.userId,
    });

    console.log("Header:", protectedHeader);
    console.log("Payload:", payload);
    return payload;
  } catch (err) {
    console.error("驗證失敗：", err);
    throw err;
  }
}
