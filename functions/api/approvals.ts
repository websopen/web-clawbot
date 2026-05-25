/**
 * Cloudflare Worker Proxy: Approvals API
 * Proxies requests to the clawbot-admin service
 */

const CLAWBOT_API = 'https://api.websopen.com/clawbot-bridge';

export const onRequestGet: PagesFunction = async () => {
    try {
        const res = await fetch(`${CLAWBOT_API}/approvals`);
        const data = await res.json();

        return Response.json(data, {
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return Response.json({
            approved: [],
            admins: [],
            error: 'Failed to connect'
        }, { status: 200 });
    }
};

export const onRequestPost: PagesFunction = async (context) => {
    try {
        const body = await context.request.json();

        const res = await fetch(`${CLAWBOT_API}/approvals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        return Response.json(data, {
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return Response.json({
            error: 'Failed to update approvals',
            details: (error as Error).message
        }, { status: 502 });
    }
};

export const onRequestOptions: PagesFunction = async () => {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
};
