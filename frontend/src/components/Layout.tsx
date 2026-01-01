import { Outlet, useLocation } from 'react-router-dom';
import { Topbar } from './Topbar';
import { ChatWidget } from './ChatWidget';
import { AnimatePresence, motion } from 'framer-motion';

export function Layout() {
    const location = useLocation();
    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <Topbar />
            <main className="container mx-auto py-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.4,
                            ease: [0.4, 0, 0.2, 1]
                        }}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>
            <ChatWidget />
        </div>
    );
}
