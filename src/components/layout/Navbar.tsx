import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useCart } from '../../context';
import { ShoppingBag, User as UserIcon, Search, Heart, Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CartDrawer from './CartDrawer';
import ConfirmationModal from '../common/ConfirmationModal';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { cartCount, isCartOpen, setIsCartOpen } = useCart();
    const navigate = useNavigate();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsSearchOpen(false);
            setSearchQuery('');
        }
    };

    return (
        <>
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

            <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-lg bg-white/95">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Top Bar */}
                    <div className="flex justify-between items-center h-20">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden btn-icon"
                            aria-label="Toggle menu"
                        >
                            <motion.div
                                animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </motion.div>
                        </button>

                        {/* Logo */}
                        <Link to="/" className="flex-shrink-0 group">
                            <div className="flex flex-col items-center group-hover:opacity-80 transition-opacity">
                                <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-gray-900 group-hover:text-black">
                                    SÉRRA
                                </h1>
                                <span className="text-[10px] md:text-xs tracking-[0.3em] font-light text-gray-900 uppercase mt-[-4px]">
                                    FASHION
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-10">
                            <Link to="/men" className="relative text-sm font-medium text-gray-700 hover:text-black transition-colors group">
                                <span className="uppercase tracking-widest">Men</span>
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full"></span>
                            </Link>
                            <Link to="/women" className="relative text-sm font-medium text-gray-700 hover:text-black transition-colors group">
                                <span className="uppercase tracking-widest">Women</span>
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full"></span>
                            </Link>
                            <Link to="/new" className="relative text-sm font-semibold text-red-600 hover:text-red-700 transition-colors group">
                                <span className="uppercase tracking-widest">New Arrivals</span>
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full"></span>
                            </Link>
                            <Link to="/sale" className="relative text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors group">
                                <span className="uppercase tracking-widest">Sale</span>
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-600 transition-all duration-300 group-hover:w-full"></span>
                            </Link>
                            {(user?.role === 'admin' || user?.role === 'super_admin') && (
                                <Link to="/admin" className="relative text-sm font-bold text-black border-2 border-black px-4 py-1.5 rounded-full hover:bg-black hover:text-white transition-all duration-300">
                                    <span className="uppercase tracking-widest text-[10px]">Admin Panel</span>
                                </Link>
                            )}
                        </div>

                        {/* Right Icons */}
                        <div className="flex items-center space-x-2 md:space-x-3">
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className="btn-icon relative group"
                                aria-label="Search"
                            >
                                <Search className="h-5 w-5 text-gray-700 group-hover:text-black icon-interactive" />
                            </button>

                            <Link
                                to="/wishlist"
                                className="btn-icon relative group"
                                aria-label="Wishlist"
                            >
                                <Heart className="h-5 w-5 text-gray-700 group-hover:text-red-500 icon-interactive" />
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                                    {user?.wishlist?.length || 0}
                                </span>
                            </Link>

                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="btn-icon relative group"
                                aria-label="Shopping bag"
                            >
                                <ShoppingBag className="h-5 w-5 text-gray-700 group-hover:text-black icon-interactive" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </button>

                            {user ? (
                                <div className="hidden md:flex items-center space-x-3 pl-3 border-l border-gray-200">
                                    <Link to="/profile" className="flex items-center space-x-2 group">
                                        <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-transparent group-hover:border-black transition-all">
                                            {user.profilePicture?.imageUrl ? (
                                                <img src={user.profilePicture.imageUrl} alt={user.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-gray-200 transition-colors">
                                                    <UserIcon className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Member</span>
                                            <span className="text-xs font-bold text-gray-900 group-hover:text-black transition-colors leading-tight truncate max-w-[80px]">
                                                {user.name.split(' ')[0]}
                                            </span>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={() => setIsLogoutModalOpen(true)}
                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="hidden md:flex items-center space-x-2 pl-3 border-l border-gray-200 text-sm font-semibold text-gray-700 hover:text-black uppercase tracking-wider transition-colors"
                                >
                                    <UserIcon className="h-5 w-5" />
                                    <span>Login</span>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Enhanced Search Bar */}
                    <AnimatePresence>
                        {isSearchOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="pb-4 overflow-hidden"
                            >
                                <form onSubmit={handleSearch} className="relative">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search for products, brands and more..."
                                        className="input-search pl-12 pr-5"
                                        autoFocus
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden border-t border-gray-100 bg-white overflow-hidden"
                        >
                            <div className="px-4 py-6 space-y-4">
                                <Link to="/men" className="block text-base font-medium text-gray-700 hover:text-black py-3 uppercase tracking-wide border-b border-gray-100">
                                    Men
                                </Link>
                                <Link to="/women" className="block text-base font-medium text-gray-700 hover:text-black py-3 uppercase tracking-wide border-b border-gray-100">
                                    Women
                                </Link>
                                <Link to="/new" className="block text-base font-semibold text-red-600 hover:text-red-700 py-3 uppercase tracking-wide border-b border-gray-100">
                                    New Arrivals
                                </Link>
                                <Link to="/sale" className="block text-base font-semibold text-amber-600 hover:text-amber-700 py-3 uppercase tracking-wide border-b border-gray-100">
                                    Sale
                                </Link>
                                {!user && (
                                    <Link to="/login" className="block text-base font-medium text-gray-700 hover:text-black py-3 uppercase tracking-wide">
                                        Login / Sign Up
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
            <ConfirmationModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={logout}
                title="Sign Out"
                message="Are you sure you want to sign out of your SÉRRA account? You'll need to log in again to access your wishlist and orders."
                confirmText="Sign Out"
                cancelText="Stay Logged In"
                variant="danger"
            />
        </>
    );
}
