import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", process.env.NEXT_PUBLIC_APP_URL || "https://attacklab.vercel.app"));
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "https://attacklab.vercel.app"}/api/auth/google/callback`;
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&access_type=offline`;

  return NextResponse.redirect(googleAuthUrl);
}
