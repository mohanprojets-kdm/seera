import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCart, useAuth } from '../context';
import { formatPrice } from '../utils';
import type { CartItem } from '../types';
import api from '../api/client';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Navbar from '../components/layout/Navbar';
import { ShieldCheck, Truck, CreditCard, ArrowRight, Loader2, CheckCircle2, Check, Plus, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
// @ts-ignore
import { useRazorpay } from 'react-razorpay';
import PremiumLoader from '../components/ui/PremiumLoader';

const COUNTRIES = [
    { name: 'India', code: '+91', states: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Uttar Pradesh', 'West Bengal'] },
    { name: 'United States', code: '+1', states: ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Washington', 'Massachusetts'] },
    { name: 'United Kingdom', code: '+44', states: ['England', 'Scotland', 'Wales', 'Northern Ireland'] },
    { name: 'United Arab Emirates', code: '+971', states: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'] },
    { name: 'Canada', code: '+1', states: ['Ontario', 'Quebec', 'British Columbia', 'Alberta'] },
];

const checkoutSchema = z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Valid phone number is required'),
    street: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    zipCode: z.string().min(5, 'Zip code is required'),
    country: z.string().min(2, 'Country is required'),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
    const { cartItems, cartTotal, clearCart, isCartLoading } = useCart();
    const { user, updateUser, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
    const [couponCode, setCouponCode] = useState('');
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY');

    const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            email: user?.email || '',
            firstName: user?.name ? user.name.split(' ')[0] : '',
            lastName: user?.name ? user.name.split(' ').slice(1).join(' ') : '',
            phone: user?.phoneNumber || '',
            country: 'India'
        }
    });

    // Reset form when user data loads
    useEffect(() => {
        if (user) {
            reset({
                email: user.email || '',
                firstName: user.name ? user.name.split(' ')[0] : '',
                lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
                phone: user.phoneNumber || '',
                country: 'India'
            });
        }
    }, [user, reset]);

    // @ts-ignore
    const { Razorpay } = useRazorpay();
    const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
    const [isAddingAddress, setIsAddingAddress] = useState(false);

    // Enhanced Address Form State
    const [isPinLoading, setIsPinLoading] = useState(false);
    const [tempAddress, setTempAddress] = useState({
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'India'
    });

    // PIN Lookup Effect
    useEffect(() => {
        const lookupPin = async () => {
            if (tempAddress.zip.length === 6 && tempAddress.country === 'India') {
                setIsPinLoading(true);
                try {
                    const res = await fetch(`https://api.postalpincode.in/pincode/${tempAddress.zip}`);
                    const data = await res.json();
                    if (data[0].Status === 'Success') {
                        const postOffice = data[0].PostOffice[0];
                        setTempAddress(prev => ({
                            ...prev,
                            city: postOffice.District,
                            state: postOffice.State
                        }));
                        toast.success(`Location identified: ${postOffice.District}`);
                    }
                } catch (e) {
                    console.error('PIN lookup failed');
                } finally {
                    setIsPinLoading(false);
                }
            }
        };
        lookupPin();
    }, [tempAddress.zip, tempAddress.country]);

    // Sync form with selected address
    useEffect(() => {
        if (!isAddingAddress && user?.address && Array.isArray(user.address) && user.address[selectedAddressIndex]) {
            const addr = user.address[selectedAddressIndex];
            setValue('street', addr.street || '');
            setValue('city', addr.city || '');
            setValue('state', addr.state || '');
            setValue('zipCode', addr.zip || '');
            setValue('country', addr.country || 'India');
        }
    }, [selectedAddressIndex, user, setValue, isAddingAddress]);

    const handleAddNewAddress = async () => {
        if (!tempAddress.street || !tempAddress.city || !tempAddress.state || !tempAddress.zip) {
            toast.error('Please fill in all address fields');
            return;
        }

        try {
            const res = await api.post('/users/address', { ...tempAddress, isDefault: user?.address?.length === 0 });
            // Update local user context
            if (user) {
                updateUser({ ...user, address: res.data.data });
            }

            toast.success('Address saved to profile');
            setIsAddingAddress(false);
            // Select the new address (last one)
            setSelectedAddressIndex(res.data.data.length - 1);
            // Reset temp address
            setTempAddress({ street: '', city: '', state: '', zip: '', country: 'India' });
        } catch (error) {
            console.error('Failed to save address', error);
            toast.error('Failed to save address');
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsValidatingCoupon(true);
        try {
            const res = await api.post('/orders/validate-coupon', { code: couponCode });
            const { discountPercentage } = res.data.data;
            const discountAmount = (cartTotal * discountPercentage) / 100;
            setDiscount(discountAmount);
            setAppliedCoupon(couponCode);
            toast.success(`Coupon applied! You saved ${discountPercentage}%`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Invalid coupon code');
            setDiscount(0);
            setAppliedCoupon(null);
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const processOrder = async (orderPayload: any) => {
        try {
            const res = await api.post('/orders', orderPayload);
            setOrderSuccess(res.data.data._id);
            clearCart();
        } catch (error) {
            console.error('Order creation failed', error);
            toast.error('Failed to create order');
        } finally {
            setIsSubmitting(false);
        }
    };

    const onSubmit = async (data: CheckoutFormData) => {
        setIsSubmitting(true);
        const finalAmount = cartTotal - discount;

        // Ensure address is synced if adding new
        if (isAddingAddress) {
            if (!tempAddress.street || !tempAddress.city || !tempAddress.state || !tempAddress.zip) {
                toast.error('Please complete the address form first');
                setIsSubmitting(false);
                return;
            }
            await api.post('/users/address', { ...tempAddress, isDefault: user?.address?.length === 0 });
            data.street = tempAddress.street;
            data.city = tempAddress.city;
            data.state = tempAddress.state;
            data.zipCode = tempAddress.zip;
            data.country = tempAddress.country;
        }

        if (paymentMethod === 'COD') {
            await processOrder({
                items: cartItems.map(item => ({
                    product: item.product._id,
                    quantity: item.quantity,
                    price: item.product.finalPrice || item.product.basePrice,
                    size: item.size,
                    color: item.color
                })),
                shippingAddress: data,
                totalAmount: finalAmount,
                paymentMethod: 'COD',
                paymentStatus: 'PENDING'
            });
            return;
        }

        // Razorpay logic
        try {
            const keyRes = await api.get('/payment/get-key');
            const razorpayKey = keyRes.data.data.key;

            const orderRes = await api.post('/payment/create-order', {
                amount: finalAmount,
                currency: 'INR'
            });

            const { id: order_id, amount, currency } = orderRes.data.data;

            const options = {
                key: razorpayKey,
                amount: amount.toString(),
                currency: currency,
                name: "SÉRRA FASHION",
                description: "Purchase Transaction",
                order_id: order_id,
                handler: async function (response: any) {
                    setIsSubmitting(true);
                    try {
                        await api.post('/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        await processOrder({
                            items: cartItems.map(item => ({
                                product: item.product._id,
                                quantity: item.quantity,
                                price: item.product.finalPrice || item.product.basePrice,
                                size: item.size,
                                color: item.color
                            })),
                            shippingAddress: data,
                            totalAmount: finalAmount,
                            paymentMethod: 'RAZORPAY',
                            paymentResult: {
                                id: response.razorpay_payment_id,
                                status: 'COMPLETED',
                                email_address: data.email
                            }
                        });

                    } catch (error) {
                        toast.error('Payment verification failed');
                        setIsSubmitting(false);
                    }
                },
                prefill: {
                    name: data.firstName + ' ' + data.lastName,
                    email: data.email,
                    contact: data.phone,
                },
                theme: {
                    color: "#000000",
                },
            };

            const rzp1 = new Razorpay(options);
            rzp1.open();
        } catch (error) {
            console.error('Payment initiation failed', error);
            toast.error('Could not initiate payment. Please try again.');
            setIsSubmitting(false);
        }
    };

    if (orderSuccess) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full bg-white border border-gray-100 rounded-[40px] p-12 text-center shadow-2xl shadow-gray-100"
                    >
                        <div className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Order Confirmed</h2>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            Thank you for your purchase. We've received your order <span className="font-bold text-black text-xs uppercase tracking-widest">#{orderSuccess.slice(-8)}</span> and are preparing it with care.
                        </p>
                        <div className="space-y-4">
                            <Button
                                onClick={async () => {
                                    try {
                                        const res = await api.get(`/orders/${orderSuccess}/invoice`, { responseType: 'blob' });
                                        const url = window.URL.createObjectURL(new Blob([res.data]));
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.setAttribute('download', `invoice-${orderSuccess.slice(-8)}.pdf`);
                                        document.body.appendChild(link);
                                        link.click();
                                        link.parentNode?.removeChild(link);
                                    } catch (e) {
                                        toast.error('Failed to download invoice');
                                    }
                                }}
                                variant="outline"
                                className="w-full h-14 border-2 flex items-center justify-center space-x-2"
                            >
                                <Download className="h-4 w-4" />
                                <span>Download Invoice</span>
                            </Button>
                            <Button onClick={() => navigate('/')} className="w-full h-14">
                                Continue Shopping
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Show loading state while user or cart data is being fetched
    if (isAuthLoading || isCartLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <PremiumLoader />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-32 text-center">
                    <h2 className="text-3xl font-serif italic text-gray-900">Please login to checkout</h2>
                    <p className="mt-4 text-gray-500">You need to be signed in to complete your purchase.</p>
                    <Button onClick={() => navigate('/login')} className="mt-8 mx-auto">Sign In</Button>
                </div>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-32 text-center">
                    <h2 className="text-3xl font-serif italic text-gray-900">Your bag is empty</h2>
                    <p className="mt-4 text-gray-500">Add some pieces to your collection before checking out.</p>
                    <Button onClick={() => navigate('/')} className="mt-8 mx-auto">Browse Collection</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 py-12 md:py-20 lg:p-24">
                <div className="flex flex-col lg:flex-row gap-16">
                    {/* Left: Form */}
                    <div className="flex-1 space-y-12">
                        <section>
                            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8">Shipping Information</h2>
                            <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <Input label="First Name" placeholder="e.g. John" error={errors.firstName?.message} {...register('firstName')} />
                                    <Input label="Last Name" placeholder="e.g. Doe" error={errors.lastName?.message} {...register('lastName')} />
                                </div>
                                <Input label="Email Address" type="email" placeholder="john@example.com" error={errors.email?.message} {...register('email')} />
                                <Input label="Phone Number" placeholder="+1 (555) 000-0000" error={errors.phone?.message} {...register('phone')} />

                                <div className="pt-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Delivery Address</h3>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingAddress(!isAddingAddress)}
                                            className="text-xs font-bold text-black hover:underline"
                                        >
                                            {isAddingAddress ? 'Cancel' : 'Add New Address'}
                                        </button>
                                    </div>

                                    {!isAddingAddress && user?.address && user.address.length > 0 && (
                                        <div className="flex space-x-4 overflow-x-auto pb-4 mb-6 custom-scrollbar">
                                            {user.address.map((addr: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setSelectedAddressIndex(idx)}
                                                    className={`min-w-[200px] p-4 rounded-2xl border cursor-pointer transition-all ${selectedAddressIndex === idx ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                            {addr.isDefault ? 'Default' : `Address ${idx + 1}`}
                                                        </span>
                                                        {selectedAddressIndex === idx && <Check className="h-4 w-4 bg-black text-white rounded-full p-0.5" />}
                                                    </div>
                                                    <p className="font-bold text-sm mt-2 line-clamp-1">{addr.street}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{addr.city}, {addr.zip}</p>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingAddress(true)}
                                                className="min-w-[50px] flex items-center justify-center rounded-2xl border border-dashed border-gray-200 hover:border-black transition-colors"
                                            >
                                                <Plus className="h-6 w-6 text-gray-300" />
                                            </button>
                                        </div>
                                    )}

                                    {isAddingAddress ? (
                                        <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-6">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-serif font-bold">New Address Details</h4>
                                                <button type="button" onClick={() => setIsAddingAddress(false)} className="text-xs text-red-500 hover:underline">Cancel</button>
                                            </div>

                                            <Input
                                                label="Street Address"
                                                placeholder="Flat, House no., Building, Street"
                                                value={tempAddress.street}
                                                onChange={(e) => setTempAddress({ ...tempAddress, street: e.target.value })}
                                            />

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Country</label>
                                                    <select
                                                        className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none"
                                                        value={tempAddress.country}
                                                        onChange={(e) => setTempAddress({ ...tempAddress, country: e.target.value, state: '' })}
                                                    >
                                                        {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">State / Province</label>
                                                    <select
                                                        className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none"
                                                        value={tempAddress.state}
                                                        onChange={(e) => setTempAddress({ ...tempAddress, state: e.target.value })}
                                                    >
                                                        <option value="">Select State</option>
                                                        {(COUNTRIES.find(c => c.name === tempAddress.country)?.states || []).map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <Input
                                                    label="City"
                                                    value={tempAddress.city}
                                                    onChange={(e) => setTempAddress({ ...tempAddress, city: e.target.value })}
                                                />
                                                <div className="relative">
                                                    <Input
                                                        label="Zip Code"
                                                        value={tempAddress.zip}
                                                        onChange={(e) => setTempAddress({ ...tempAddress, zip: e.target.value })}
                                                    />
                                                    {isPinLoading && (
                                                        <div className="absolute right-4 top-14">
                                                            <PremiumLoader size="sm" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleAddNewAddress}
                                                className="w-full py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                                            >
                                                Save Address
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 opacity-50 pointer-events-none grayscale" aria-hidden="true">
                                            {/* Visual placeholder for form when selecting address */}
                                            <Input label="Street Address" placeholder="Selected Address" readOnly value={user?.address?.[selectedAddressIndex]?.street || ''} />
                                            <div className="grid grid-cols-2 gap-6">
                                                <Input label="City" readOnly value={user?.address?.[selectedAddressIndex]?.city || ''} />
                                                <Input label="State" readOnly value={user?.address?.[selectedAddressIndex]?.state || ''} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </section>

                        <section className="bg-white p-8 rounded-[32px] border border-gray-100 space-y-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-50 pb-4 flex items-center">
                                <CreditCard className="h-4 w-4 mr-2" />
                                Payment Method
                            </h3>
                            <div className="space-y-4">
                                <div
                                    onClick={() => setPaymentMethod('RAZORPAY')}
                                    className={`p-4 rounded-2xl border flex items-center justify-between group cursor-pointer transition-all ${paymentMethod === 'RAZORPAY' ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 bg-[#3395FF] rounded-xl flex items-center justify-center shadow-sm text-white font-bold text-xs">
                                            Pay
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Razorpay Secure</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">UPI / Cards / Netbanking</p>
                                        </div>
                                    </div>
                                    <div className={`h-4 w-4 rounded-full border-2 border-black flex items-center justify-center p-0.5`}>
                                        {paymentMethod === 'RAZORPAY' && <div className="h-full w-full bg-black rounded-full" />}
                                    </div>
                                </div>

                                <div
                                    onClick={() => setPaymentMethod('COD')}
                                    className={`p-4 rounded-2xl border flex items-center justify-between group cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center shadow-sm text-white font-bold text-xs">
                                            COD
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Cash On Delivery</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Pay when your order arrives</p>
                                        </div>
                                    </div>
                                    <div className={`h-4 w-4 rounded-full border-2 border-black flex items-center justify-center p-0.5`}>
                                        {paymentMethod === 'COD' && <div className="h-full w-full bg-black rounded-full" />}
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest text-center">Your transaction is encrypted and secure.</p>
                        </section>
                    </div>

                    {/* Right: Summary */}
                    <div className="w-full lg:w-[400px]">
                        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm sticky top-32">
                            <h2 className="text-xl font-serif font-bold text-gray-900 mb-8 pb-4 border-b border-gray-50">Order Summary</h2>

                            <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                                {cartItems.map((item: CartItem, i: number) => {
                                    const product = item.product || {};
                                    const images = product.images || [];
                                    const imageUrl = images[0]?.imageUrl || 'https://via.placeholder.com/150';
                                    const title = product.title || 'Unknown Product';
                                    const price = product.finalPrice || product.basePrice || 0;

                                    return (
                                        <div key={i} className="flex space-x-4">
                                            <div className="h-20 w-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                                                <img src={imageUrl} className="h-full w-full object-cover" alt={title} />
                                            </div>
                                            <div className="flex-1 text-sm">
                                                <p className="font-bold text-gray-900 line-clamp-1">{title}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">Size: {item.size} • Qty: {item.quantity}</p>
                                                <p className="font-bold text-gray-900 mt-1">{formatPrice(price * item.quantity)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="space-y-4 pt-6 border-t border-gray-50">
                                {/* Coupon Input */}
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        placeholder="Promo Code"
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-black uppercase transition-colors"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleApplyCoupon}
                                        isLoading={isValidatingCoupon}
                                        className="h-10 px-4 text-xs"
                                    >
                                        Apply
                                    </Button>
                                </div>

                                <div className="flex justify-between text-sm text-gray-500 pt-4">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(cartTotal)}</span>
                                </div>

                                {discount > 0 && (
                                    <div className="flex justify-between text-sm text-emerald-600 font-medium">
                                        <span>Discount ({appliedCoupon})</span>
                                        <span>-{formatPrice(discount)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Shipping</span>
                                    <span className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">Complimentary</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 pt-4 border-t border-gray-100">
                                    <span className="font-serif italic text-xl">Total</span>
                                    <span>{formatPrice(cartTotal - discount)}</span>
                                </div>
                            </div>

                            <Button
                                form="checkout-form"
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-16 rounded-[28px] mt-8 group"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>Confirm Order</span>
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>

                            <div className="flex items-center justify-center space-x-6 mt-8">
                                <div className="flex flex-col items-center">
                                    <ShieldCheck className="h-5 w-5 text-gray-300 mb-1" />
                                    <span className="text-[8px] font-black uppercase text-gray-400">Secure</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <Truck className="h-5 w-5 text-gray-300 mb-1" />
                                    <span className="text-[8px] font-black uppercase text-gray-400">Insured</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
