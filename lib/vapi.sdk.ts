import Vapi from "@vapi-ai/web";

const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;

if (!token) {
  if (process.env.NODE_ENV != "production")
    console.warn("NEXT_PUBLIC_VAPI_WEB_TOKEN is missing!");

  throw new Error("VAPI token not found");
}

export const vapi = new Vapi(token!);
