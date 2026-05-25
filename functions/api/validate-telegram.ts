/**
 * Cloudflare Pages Function: Validate Telegram InitData
 * 
 * Valida el hash HMAC de Telegram para asegurar que el initData es auténtico.
 * Endpoint: POST /api/validate-telegram
 */

// Bot Token for ClawBot (@ClawdWebsopen3587_bot)
const BOT_TOKEN = '8340440742:AAGa8R17-SIZQQlvqZ5msls1xtZgUcGZVc0';
const AUTHORIZED_USER_ID = 7616797355;

interface Env {
    // Add secrets here if needed
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const { initData } = await context.request.json() as { initData: string };

        if (!initData) {
            return Response.json({
                valid: false,
                error: 'initData is required'
            }, { status: 400 });
        }

        // Parse initData
        const params = new URLSearchParams(initData);
        const hash = params.get('hash');

        if (!hash) {
            return Response.json({
                valid: false,
                error: 'hash not found in initData'
            }, { status: 400 });
        }

        // Sort and concatenate data-check-string
        params.delete('hash');
        const dataCheckArr: string[] = [];
        params.forEach((value, key) => {
            dataCheckArr.push(`${key}=${value}`);
        });
        dataCheckArr.sort();
        const dataCheckString = dataCheckArr.join('\n');

        // Create HMAC-SHA256
        const encoder = new TextEncoder();

        // Step 1: HMAC-SHA256 of "WebAppData" with bot token
        const secretKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode('WebAppData'),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const secretHash = await crypto.subtle.sign(
            'HMAC',
            secretKey,
            encoder.encode(BOT_TOKEN)
        );

        // Step 2: HMAC-SHA256 of data-check-string with secret hash
        const dataKey = await crypto.subtle.importKey(
            'raw',
            secretHash,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const calculatedHash = await crypto.subtle.sign(
            'HMAC',
            dataKey,
            encoder.encode(dataCheckString)
        );

        // Convert to hex
        const hashHex = Array.from(new Uint8Array(calculatedHash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        // Validate hash
        const isValidHash = hashHex === hash;

        if (!isValidHash) {
            return Response.json({
                valid: false,
                error: 'Invalid hash - data may be tampered'
            }, { status: 403 });
        }

        // Parse user from initData
        const userStr = params.get('user');
        if (!userStr) {
            return Response.json({
                valid: false,
                error: 'No user data in initData'
            }, { status: 400 });
        }

        const user = JSON.parse(decodeURIComponent(userStr));

        // Validate authorized user
        if (user.id !== AUTHORIZED_USER_ID) {
            return Response.json({
                valid: false,
                error: `User ${user.id} is not authorized`,
                user_id: user.id
            }, { status: 403 });
        }

        // Check auth_date (reject if > 1 hour)
        const authDate = parseInt(params.get('auth_date') || '0');
        const now = Math.floor(Date.now() / 1000);
        const maxAge = 3600;

        if (now - authDate > maxAge) {
            return Response.json({
                valid: false,
                error: 'Auth data expired (> 1 hour old)'
            }, { status: 401 });
        }

        // All validations passed!
        return Response.json({
            valid: true,
            user: {
                id: user.id,
                first_name: user.first_name,
                username: user.username
            },
            expires_at: new Date((authDate + maxAge) * 1000).toISOString()
        });

    } catch (error) {
        console.error('Validation error:', error);
        return Response.json({
            valid: false,
            error: `Server error: ${(error as Error).message}`
        }, { status: 500 });
    }
};

// GET for health check
export const onRequestGet: PagesFunction<Env> = async () => {
    return Response.json({
        service: 'clawbot-auth-validator',
        status: 'ok',
        authorized_user: AUTHORIZED_USER_ID
    });
};
