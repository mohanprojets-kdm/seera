import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler } from 'lucide-react';

interface SizeGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
    const sizeChart = [
        { size: 'XS', chest: '34-36', waist: '28-30', hips: '36-38' },
        { size: 'S', chest: '36-38', waist: '30-32', hips: '38-40' },
        { size: 'M', chest: '38-40', waist: '32-34', hips: '40-42' },
        { size: 'L', chest: '40-42', waist: '34-36', hips: '42-44' },
        { size: 'XL', chest: '42-44', waist: '36-38', hips: '44-46' },
        { size: 'XXL', chest: '44-46', waist: '38-40', hips: '46-48' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden z-10"
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-black rounded-2xl flex items-center justify-center">
                                    <Ruler className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-serif font-bold text-gray-900">Size Guide</h2>
                                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Find Your Perfect Fit</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-50 rounded-full transition-colors touch-target"
                                aria-label="Close size guide"
                            >
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto max-h-[calc(85vh-140px)] custom-scrollbar">
                            {/* Measurement Instructions */}
                            <div className="mb-8 p-6 bg-gray-50 rounded-3xl">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-4">How to Measure</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <div className="h-8 w-8 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                                        <p className="text-xs font-bold text-gray-700">Chest</p>
                                        <p className="text-xs text-gray-500 leading-relaxed">Measure around the fullest part of your chest, keeping the tape measure horizontal.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-8 w-8 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                                        <p className="text-xs font-bold text-gray-700">Waist</p>
                                        <p className="text-xs text-gray-500 leading-relaxed">Measure around your natural waistline, keeping the tape comfortably loose.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-8 w-8 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                                        <p className="text-xs font-bold text-gray-700">Hips</p>
                                        <p className="text-xs text-gray-500 leading-relaxed">Measure around the fullest part of your hips, approximately 8" below waist.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Size Chart Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-gray-900">
                                            <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest text-gray-900">Size</th>
                                            <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest text-gray-900">Chest (inches)</th>
                                            <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest text-gray-900">Waist (inches)</th>
                                            <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest text-gray-900">Hips (inches)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {sizeChart.map((row) => (
                                            <tr key={row.size} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-4 font-bold text-gray-900">{row.size}</td>
                                                <td className="py-4 px-4 text-sm text-gray-600">{row.chest}</td>
                                                <td className="py-4 px-4 text-sm text-gray-600">{row.waist}</td>
                                                <td className="py-4 px-4 text-sm text-gray-600">{row.hips}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Additional Info */}
                            <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-3xl">
                                <p className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">Sizing Note</p>
                                <p className="text-sm text-amber-800 leading-relaxed">
                                    All measurements are in inches. If you're between sizes, we recommend sizing up for a more comfortable fit.
                                    Still unsure? Contact our customer service team for personalized assistance.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                            >
                                Got It
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
