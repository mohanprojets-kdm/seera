import { motion } from 'framer-motion';

interface PremiumLoaderProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
}

export default function PremiumLoader({ size = 'md', text, className = '' }: PremiumLoaderProps) {
    const sizeMap = {
        sm: 'h-6 w-6',
        md: 'h-12 w-12',
        lg: 'h-20 w-20'
    };

    return (
        <div className={`flex flex-col items-center justify-center space-y-6 ${className}`}>
            <div className={`relative ${sizeMap[size]} flex items-center justify-center`}>
                {/* Ambient Glow */}
                <motion.div
                    className="absolute inset-0 bg-black/5 rounded-full blur-xl"
                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Elegant Rotating Ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border-[1.5px] border-gray-100 border-t-black border-r-black/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />

                {/* Counter Rotating Inner Ring */}
                <motion.div
                    className="absolute inset-[15%] rounded-full border-[1px] border-transparent border-b-black/50"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />

                {/* Breathing Core */}
                <motion.div
                    className="h-1.5 w-1.5 bg-black rounded-full"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {text && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center space-y-1"
                >
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black">
                        {text}
                    </span>
                    <motion.div
                        className="h-px bg-gray-200 w-12"
                        animate={{ scaleX: [0, 1, 0], opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                </motion.div>
            )}
        </div>
    );
}
