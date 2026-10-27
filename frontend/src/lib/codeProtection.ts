/**
 * Axiaris (RegAI) — Client-Side Source Code & Anti-Inspection Guard
 *
 * Blocks keyboard shortcuts (F10, F12, Ctrl/Cmd+Shift+I/J/C/K, Ctrl/Cmd+U, Ctrl/Cmd+S),
 * disables context-menu "Inspect Element" / "View Source", strips production console output,
 * and detects docked DevTools to mask the live DOM tree.
 */

const OVERLAY_ID = 'axiaris-security-devtools-shield';

function isBlockedShortcut(event: KeyboardEvent): boolean {
    const key = event.key.toUpperCase();
    const code = event.code;
    const ctrlOrMeta = event.ctrlKey || event.metaKey;
    const shiftOrAlt = event.shiftKey || event.altKey;

    // Block F10 and F12 directly
    if (key === 'F10' || key === 'F12' || code === 'F10' || code === 'F12') {
        return true;
    }

    // Block DevTools shortcuts: Ctrl/Cmd + Shift/Option + I / J / C / K / U
    if (ctrlOrMeta && shiftOrAlt && ['I', 'J', 'C', 'K', 'U'].includes(key)) {
        return true;
    }

    // Block View Source (Ctrl/Cmd + U) and Save Page (Ctrl/Cmd + S)
    if (ctrlOrMeta && !event.shiftKey && (key === 'U' || key === 'S')) {
        return true;
    }

    return false;
}

function setSecurityOverlayVisible(visible: boolean): void {
    if (typeof document === 'undefined') return;
    let overlay = document.getElementById(OVERLAY_ID);

    if (visible) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = OVERLAY_ID;
            overlay.setAttribute('role', 'alertdialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-label', 'Защита исходного кода Axiaris RegAI');
            overlay.style.cssText = [
                'position:fixed',
                'inset:0',
                'z-index:2147483647',
                'display:flex',
                'flex-direction:column',
                'align-items:center',
                'justify-content:center',
                'background:rgba(6, 11, 25, 0.96)',
                'backdrop-filter:blur(16px)',
                'color:#f8fafc',
                'font-family:system-ui,-apple-system,sans-serif',
                'padding:24px',
                'text-align:center',
                'user-select:none',
            ].join(';');

            const badge = document.createElement('div');
            badge.style.cssText =
                'padding:6px 14px;border-radius:9999px;background:rgba(6,182,212,0.15);border:1px solid rgba(6,182,212,0.4);color:#22d3ee;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:16px;';
            badge.textContent = 'Axiaris Security Shield';

            const title = document.createElement('h2');
            title.style.cssText = 'font-size:22px;font-weight:700;margin:0 0 10px 0;color:#ffffff;';
            title.textContent = 'Просмотр исходного кода и инспекция страницы заблокированы';

            const desc = document.createElement('p');
            desc.style.cssText = 'font-size:14px;max-width:480px;line-height:1.6;color:#94a3b8;margin:0;';
            desc.textContent =
                'В целях защиты финансовой тайны и алгоритмов трансформации МСФО горячие клавиши отладки (F10, F12, Ctrl+U) и инструменты разработчика отключены политикой безопасности организации.';

            overlay.appendChild(badge);
            overlay.appendChild(title);
            overlay.appendChild(desc);
            document.body.appendChild(overlay);
        }
    } else if (overlay) {
        overlay.remove();
    }
}

export function initClientCodeProtection(): void {
    if (typeof window === 'undefined') return;

    // 1. Block F10, F12, View Source, Save Page, and Inspector shortcuts in capture phase
    window.addEventListener(
        'keydown',
        (event: KeyboardEvent) => {
            if (isBlockedShortcut(event)) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                return false;
            }
        },
        { capture: true }
    );

    // 2. Disable right-click context menu ("Inspect" / "View Page Source")
    window.addEventListener(
        'contextmenu',
        (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            return false;
        },
        { capture: true }
    );

    // 3. Prevent dragging DOM nodes / images out to inspect URLs
    window.addEventListener(
        'dragstart',
        (event: DragEvent) => {
            const target = event.target as HTMLElement | null;
            if (target && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                event.preventDefault();
            }
        },
        { capture: true }
    );

    // 4. Detect docked DevTools via viewport delta & sanitize console in production
    const checkDevToolsState = () => {
        const widthGap = window.outerWidth - window.innerWidth;
        const heightGap = window.outerHeight - window.innerHeight;
        // Account for normal browser chrome; > 170px gap indicates docked DevTools pane
        const isDockedDevToolsOpen = widthGap > 170 || heightGap > 170;
        setSecurityOverlayVisible(isDockedDevToolsOpen);
    };

    window.addEventListener('resize', checkDevToolsState);

    if (import.meta.env.PROD) {
        const noop = () => undefined;
        try {
            console.clear();
            console.log(
                '%cСТОП! Защищенная среда Axiaris RegAI',
                'color:#ef4444;font-size:20px;font-weight:bold;'
            );
            console.log(
                '%cДоступ к консоли разработчика и исходному коду запрещен политикой информационной безопасности.',
                'color:#94a3b8;font-size:13px;'
            );
            console.log = noop;
            console.debug = noop;
            console.info = noop;
            console.table = noop;
            console.dir = noop;
        } catch {
            // Ignore read-only console environments
        }
    }
}
