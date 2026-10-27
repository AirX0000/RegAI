import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { BetaBanner } from './BetaBanner';

const ChatWidget = React.lazy(() =>
    import('./ChatWidget').then((m) => ({ default: m.ChatWidget }))
);

export function Layout() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans antialiased transition-colors duration-200 dark:bg-[#050814] dark:bg-axiaris-glow flex flex-col w-full overflow-x-hidden">
            <Topbar />
            <BetaBanner />
            <main className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 min-w-0">
                <div className="w-full min-w-0">
                    <Outlet />
                </div>
            </main>
            <Suspense fallback={null}>
                <ChatWidget />
            </Suspense>
        </div>
    );
}
