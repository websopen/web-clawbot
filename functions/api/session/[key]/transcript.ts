/**
 * Cloudflare Worker Proxy: Session Transcript API
 * Proxies requests to the clawbot-admin service
 */

const CLAWBOT_API = 'https://api.websopen.com/clawbot-api';

interface RouteParams {
    key: string;
}

export const onRequestGet: PagesFunction<any, 'key'> = async (context) => {
    try {
        const sessionKey = context.params.key;

        const res = await fetch(`${CLAWBOT_API}/session/${encodeURIComponent(sessionKey)}/transcript`);
        const data = await res.json();

        return Response.json(data, {
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return Response.json({
            transcript: [],
            error: 'Failed to fetch transcript'
        }, { status: 200 });
    }
};
