import { NextRequest } from "next/server";

const INSTALL_SCRIPT_URL =
  "https://raw.githubusercontent.com/moru-ai/moru/main/install.sh";
const POSTHOG_HOST = "https://us.i.posthog.com";

async function sendPostHogEvent(
  apiKey: string,
  event: string,
  properties: Record<string, unknown>,
  distinctId: string
): Promise<void> {
  try {
    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: distinctId,
        timestamp: new Date().toISOString(),
        properties: {
          ...properties,
          $lib: "vercel-edge",
          $lib_version: "1.0.0",
        },
      }),
    });
  } catch (error) {
    console.error("Failed to send PostHog event:", error);
  }
}

function parseUserAgent(ua: string): { os: string; arch: string } {
  let os = "unknown";
  let arch = "unknown";

  if (ua.includes("Mac") || ua.includes("Darwin")) {
    os = "darwin";
  } else if (ua.includes("Linux")) {
    os = "linux";
  } else if (ua.includes("Windows") || ua.includes("Win")) {
    os = "windows";
  }

  if (ua.includes("arm64") || ua.includes("aarch64")) {
    arch = "arm64";
  } else if (
    ua.includes("x86_64") ||
    ua.includes("x64") ||
    ua.includes("amd64")
  ) {
    arch = "x64";
  }

  return { os, arch };
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

export async function GET(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  const { os, arch } = parseUserAgent(userAgent);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "anonymous";
  const country = request.headers.get("x-vercel-ip-country") || "unknown";
  const city = request.headers.get("x-vercel-ip-city") || "unknown";

  // Combine IP + User-Agent for more unique tracking
  // Different machines on same network will have different IDs
  const distinctId = await hashString(`${ip}:${userAgent}`);

  // Send PostHog event (non-blocking)
  // Use the same PostHog key as the client-side (works for server-side too)
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (posthogKey) {
    // Don't await - fire and forget
    sendPostHogEvent(
      posthogKey,
      "cli_install_script_downloaded",
      {
        user_agent: userAgent,
        detected_os: os,
        detected_arch: arch,
        country,
        city,
        referrer: request.headers.get("referer") || "",
        $geoip_country_code: country,
        $geoip_city_name: city,
      },
      distinctId
    );
  }

  // Fetch install script from GitHub
  const response = await fetch(INSTALL_SCRIPT_URL, {
    headers: { "User-Agent": "moru-cli-install/1.0" },
  });

  if (!response.ok) {
    return new Response("Failed to fetch install script", { status: 502 });
  }

  const script = await response.text();

  return new Response(script, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
