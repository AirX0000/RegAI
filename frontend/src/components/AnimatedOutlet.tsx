import { useOutlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
    },
    exit: {
        opacity: 0,
        y: -20,
    },
};

const pageTransition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.3,
};

export function AnimatedOutlet() {
    const location = useLocation();
    const outlet = useOutlet();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
                className="w-full h-full"
            >
                {outlet}
            </motion.div>
        </AnimatePresence>
    );
}
