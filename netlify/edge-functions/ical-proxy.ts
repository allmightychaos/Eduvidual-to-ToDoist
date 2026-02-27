import type { Config, Context } from "@netlify/edge-functions";

export default async function handler(req: Request, context: Context): Promise<Response> {
    const icalUrl = Netlify.env.get("EDUVIDUAL_ICAL_URL");

    if (!icalUrl) {
        return new Response("EDUVIDUAL_ICAL_URL not configured", { status: 500 });
    }

    try {
        const upstream = await fetch(icalUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; CalendarSync/1.0)",
                "Accept": "text/calendar, text/plain, */*",
            },
        });

        if (!upstream.ok) {
            return new Response(`Upstream error: ${upstream.status} ${upstream.statusText}`, {
                status: upstream.status,
            });
        }

        const body = await upstream.text();

        return new Response(body, {
            status: 200,
            headers: {
                "Content-Type": "text/calendar; charset=utf-8",
                "Cache-Control": "no-store",
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(`Proxy fetch failed: ${message}`, { status: 502 });
    }
}

export const config: Config = {
    path: "/ical-proxy",
};
