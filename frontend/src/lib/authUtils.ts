/**
 * Lightweight authentication utilities
 */

export function safeBase64Encode(str: string): string {
    try {
        const bytes = new TextEncoder().encode(str);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    } catch {
        return btoa(unescape(encodeURIComponent(str)));
    }
}

export function safeBase64Decode(base64: string): string {
    try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch {
        return decodeURIComponent(escape(atob(base64)));
    }
}

export function createMockToken(user: any): string {
    const header = safeBase64Encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = safeBase64Encode(
        JSON.stringify({
            sub: user.email,
            email: user.email,
            name: user.full_name || user.name || (user.role === 'superadmin' ? 'System Administrator' : 'Administrator'),
            full_name: user.full_name || user.name || (user.role === 'superadmin' ? 'System Administrator' : 'Administrator'),
            role: user.role,
            tid: user.tenant_id,
            cid: user.company_id,
            exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600, // 30 days
        })
    );
    const signature = safeBase64Encode('mock_signature_regai_2026');
    return `${header}.${payload}.${signature}`;
}
