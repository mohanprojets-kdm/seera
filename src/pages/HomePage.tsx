import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import Navbar from "../components/layout/Navbar";
import ProductCard from "../components/ui/ProductCard";
import type { Product } from "../types";
import { ChevronRight, TrendingUp, Sparkles, Search } from "lucide-react";
import { motion } from "framer-motion";

import { useEffect, useRef } from "react";

export default function HomePage() {
    const navigate = useNavigate();
    const observerTarget = useRef(null);

    const {
        data: infiniteData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error
    } = useInfiniteQuery({
        queryKey: ["products-infinite"],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await api.get(`/products?page=${pageParam}&limit=8`);
            return res.data.data;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (lastPage.page < lastPage.totalPages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
    });

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const res = await api.get("/categories");
            // API response structure might be { data: { categories: [...] } } or just array in data
            // Based on other files it seems to be res.data.data
            return res.data.data as any[];
        }
    });

    return (
        <div className="min-h-screen bg-white text-black">

            {/* NAVBAR */}
            <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-black/5">
                <Navbar />
            </div>

            {/* HERO */}
            <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-black">
                <motion.img
                    initial={{ scale: 1.15 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 18 }}
                    src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070"
                    className="absolute inset-0 w-full h-full object-cover opacity-45"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />

                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="relative z-10 text-center max-w-5xl px-6"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/10 border border-white/20 backdrop-blur">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-xs uppercase tracking-widest text-white font-semibold">
                            New Collection 2024
                        </span>
                    </div>

                    <h1 className="font-serif text-white text-5xl md:text-7xl lg:text-8xl mb-6 leading-tight">
                        Define Your <br />
                        <span className="bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
                            Signature Style
                        </span>
                    </h1>

                    <p className="text-gray-200 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                        Elevated essentials designed for modern wardrobes.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={() => navigate('/collection')} className="btn-primary group">
                            Explore Collection
                            <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition" />
                        </button>

                        <button onClick={() => navigate('/sale')} className="btn-secondary">
                            Shop Sale
                        </button>
                    </div>
                </motion.div>
            </section>

            {/* CATEGORY BAR */}
            <div className="sticky top-[72px] bg-white z-40 border-b border-black/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex gap-10 py-6 overflow-x-auto text-xs uppercase tracking-widest font-semibold scrollbar-hide">
                        <button
                            onClick={() => navigate('/collection')}
                            className="relative text-black transition flex-shrink-0"
                        >
                            All
                            <span className="absolute left-0 -bottom-1 w-full h-[1px] bg-black" />
                        </button>
                        {(categories || []).filter(c => c && c.isActive).map(
                            (cat) => (
                                <button
                                    key={cat._id}
                                    onClick={() => navigate(`/collection?category=${cat._id}`)}
                                    className="relative text-gray-500 hover:text-black transition flex-shrink-0 group"
                                >
                                    {cat.name}
                                    <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-black group-hover:w-full transition-all duration-300" />
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* PRODUCTS */}
            <main className="bg-gray-50 py-20">
                <div className="max-w-7xl mx-auto px-6">

                    {/* Header + Controls */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="w-5 h-5 text-red-600" />
                                <span className="text-xs uppercase tracking-widest font-bold text-red-600">
                                    Trending
                                </span>
                            </div>
                            <h2 className="font-serif text-4xl md:text-5xl">
                                Trending Now
                            </h2>
                            <p className="text-gray-500 mt-2">
                                The most wanted styles right now
                            </p>
                        </div>

                        <div className="flex gap-3">
                            {/* Search */}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const q = (e.currentTarget.elements.namedItem('search') as HTMLInputElement).value;
                                    if (q) navigate(`/search?q=${q}`);
                                }}
                                className="relative"
                            >
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    name="search"
                                    placeholder="Search products"
                                    className="input pl-11"
                                />
                            </form>

                            {/* Sort */}
                            <select className="input">
                                <option>Popular</option>
                                <option>Price: Low to High</option>
                                <option>Price: High to Low</option>
                                <option>Newest</option>
                            </select>
                        </div>
                    </div>

                    {/* Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="animate-pulse space-y-4">
                                    <div className="aspect-[3/4] bg-gray-200 rounded-xl" />
                                    <div className="h-3 bg-gray-200 w-3/4 rounded" />
                                    <div className="h-3 bg-gray-200 w-1/4 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="py-20 text-center bg-white rounded-xl shadow-sm">
                            <p className="text-red-600 font-semibold">
                                Failed to load products
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                                {infiniteData?.pages.map((page) => (
                                    page.products.map((product: Product) => (
                                        <ProductCard key={product._id} product={product} />
                                    ))
                                ))}
                            </div>

                            {/* Observer Target */}
                            <div ref={observerTarget} className="h-10 mt-10 flex items-center justify-center">
                                {isFetchingNextPage && (
                                    <div className="flex space-x-2">
                                        <div className="w-2 h-2 bg-black rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                )}
                            </div>
                        </>
                    )}


                </div>
            </main>

            {/* FOOTER */}
            <footer className="bg-black text-gray-400 py-20 text-sm">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
                    <div>
                        <h3 className="font-serif text-3xl text-white mb-4">SÉRRA FASHION</h3>
                        <p>Modern fashion with timeless appeal.</p>
                    </div>

                    <div>
                        <h4 className="uppercase tracking-widest text-xs text-white mb-4">Shop</h4>
                        <ul className="space-y-3">
                            <li><Link to="/collection" className="hover:text-white transition">Full Collection</Link></li>
                            <li><Link to="/men" className="hover:text-white transition">Men's Wardrobe</Link></li>
                            <li><Link to="/women" className="hover:text-white transition">Women's Collection</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="uppercase tracking-widest text-xs text-white mb-4">Support</h4>
                        <ul className="space-y-3">
                            <li><Link to="/orders" className="hover:text-white transition">Track Order</Link></li>
                            <li><Link to="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link></li>
                            <li><Link to="/profile" className="hover:text-white transition">My Account</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="uppercase tracking-widest text-xs text-white mb-4">Connect</h4>
                        <ul className="space-y-3">
                            <li className="hover:text-white transition cursor-pointer">Instagram</li>
                            <li className="hover:text-white transition cursor-pointer">Pinterest</li>
                            <li className="hover:text-white transition cursor-pointer">X / Twitter</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-16 text-center text-xs text-gray-500">
                    © 2024 SERRA — All Rights Reserved
                </div>
            </footer>
        </div>
    );
}
