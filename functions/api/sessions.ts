/**
 * Cloudflare Worker Proxy: Sessions API
 * Proxies requests to the clawbot-admin service
 */

const CLAWBOT_API = 'https://api.websopen.com/clawbot-bridge';

export const onRequestGet: PagesFunction = async () => {
    try {
        const res = await fetch(`${CLAWBOT_API}/sessions`);
        const data = await res.json();

        return Response.json(data, {
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return Response.json({
            error: 'Failed to connect to ClawBot API',
            details: (error as Error).message
        }, { status: 502 });
    }
};
