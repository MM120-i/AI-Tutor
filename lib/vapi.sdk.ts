import Vapi from "@vapi-ai/web";

const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;

if (!token) {
  console.warn("⚠️ NEXT_PUBLIC_VAPI_WEB_TOKEN is not set!");
} else {
  console.log("✅ VAPI token found:", token.substring(0, 10) + "...");
}

export const vapi = new Vapi(token!);
