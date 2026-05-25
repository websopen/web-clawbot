/**
 * Telegram Authentication for ClawBot Web
 * Validates access exclusively from Telegram WebApp
 */

export interface TelegramAuthData {
    sessionToken: string;
    expiresAt: string;
    user: {
        id: number;
        username: string;
        firstName: string;
    };
}

// Authorized user ID (same as admin)
const AUTHORIZED_USER_ID = 7616797355;

export const authenticateFromTelegram = async (): Promise<TelegramAuthData | null> => {
    // 1. Check for token in URL (from InlineKeyboardButton WebAppInfo)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('admin_token');
    
    if (urlToken) {
        try {
            // Decode JWT payload (base64url)
            const payload = JSON.parse(atob(urlToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            
            if (payload.user_id !== AUTHORIZED_USER_ID) {
                console.error('[TelegramAuth] ❌ Unauthorized user from URL:', payload.user_id);
                return null;
            }

            const authData: TelegramAuthData = {
                sessionToken: urlToken,
                expiresAt: new Date(payload.exp * 1000).toISOString(),
                user: {
                    id: payload.user_id,
                    username: payload.username || 'N/A',
                    firstName: payload.first_name || 'Admin'
                }
            };
            
            localStorage.setItem('clawbot_session', authData.sessionToken);
            localStorage.setItem('clawbot_session_exp', authData.expiresAt);
            localStorage.setItem('clawbot_user', JSON.stringify(authData.user));
            
            console.log('[TelegramAuth] ✅ Authenticated via URL token as', authData.user.firstName);
            
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.expand();
            }
            return authData;
        } catch (e) {
            console.error('[TelegramAuth] Failed to parse URL token:', e);
        }
    }

    // 2. Fallback to standard Telegram WebApp initData
    if (!window.Telegram?.WebApp) {
        console.error('[TelegramAuth] Not in Telegram WebApp');
        return null;
    }

    const WebApp = window.Telegram.WebApp;
    const initDataUnsafe = WebApp.initDataUnsafe;

    if (!initDataUnsafe || !initDataUnsafe.user) {
        console.error('[TelegramAuth] No user data available');
        return null;
    }

    const user = initDataUnsafe.user;

    console.log('[TelegramAuth] User attempting access:', user.id, user.username);

    // Validate user ID
    if (user.id !== AUTHORIZED_USER_ID) {
        console.error('[TelegramAuth] ❌ Unauthorized user:', user.id);
        WebApp.showAlert('⛔ Acceso denegado. Usuario no autorizado.');
        return null;
    }

    // User is authorized - create session using the raw initData if possible, 
    // but the backend requires a JWT for our specific setup. 
    // Since we now pass the admin_token, the initData fallback might fail in backend if not sent correctly.
    // For now, we store a mock token for local dev or rely on the URL token.
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const sessionToken = window.Telegram.WebApp.initData || btoa(JSON.stringify({
        user_id: user.id,
        username: user.username,
        exp: expiresAt.getTime()
    }));

    const authData: TelegramAuthData = {
        sessionToken,
        expiresAt: expiresAt.toISOString(),
        user: {
            id: user.id,
            username: user.username || 'N/A',
            firstName: user.first_name || 'Admin'
        }
    };

    // Store session
    localStorage.setItem('clawbot_session', authData.sessionToken);
    localStorage.setItem('clawbot_session_exp', authData.expiresAt);
    localStorage.setItem('clawbot_user', JSON.stringify(authData.user));

    console.log('[TelegramAuth] ✅ Authenticated via initData as', authData.user.firstName);

    // Expand WebApp to full height
    WebApp.expand();

    return authData;
};

/**
 * Checks if there's a valid session
 */
export const hasValidSession = (): boolean => {
    const token = localStorage.getItem('clawbot_session');
    const exp = localStorage.getItem('clawbot_session_exp');

    if (!token || !exp) return false;

    const expiresAt = new Date(exp);
    const now = new Date();

    if (expiresAt <= now) {
        console.log('[TelegramAuth] Session expired');
        clearSession();
        return false;
    }

    return true;
};

/**
 * Gets current user data
 */
export const getCurrentUser = (): TelegramAuthData['user'] | null => {
    if (!hasValidSession()) return null;

    const userJson = localStorage.getItem('clawbot_user');
    if (!userJson) return null;

    try {
        return JSON.parse(userJson);
    } catch {
        return null;
    }
};

/**
 * Clears session
 */
export const clearSession = (): void => {
    localStorage.removeItem('clawbot_session');
    localStorage.removeItem('clawbot_session_exp');
    localStorage.removeItem('clawbot_user');
};

/**
 * Checks if we're in Telegram or localhost (dev)
 */
export const isAllowedAccess = (): boolean => {
    const isLocalhost = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

    return !!window.Telegram?.WebApp || isLocalhost;
};
