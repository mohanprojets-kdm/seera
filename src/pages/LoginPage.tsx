import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context';
import { useMutation } from '@tanstack/react-query';
import api from '../api/client';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { motion } from 'framer-motion';
import { LogIn, ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import * as z from 'zod';
import { useState } from 'react';
import SocialLoginSelector from '../components/auth/SocialLoginSelector';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [socialProvider, setSocialProvider] = useState<'Google' | 'Facebook' | null>(null);

    const socialMutation = useMutation({
        mutationFn: async (data: { email: string, name: string, provider: string, profilePicture?: string, idToken?: string, accessToken?: string }) => {
            const res = await api.post('/auth/social-login', data);
            return res.data;
        },
        onSuccess: (data) => {
            login(data.data);
            toast.success(`Welcome to SÉRRA FASHION STUDIO. Authenticated via ${socialProvider} Vault.`);
            navigate('/');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Social authentication failed.');
        }
    });

    const handleSocialSelect = (account: any) => {
        socialMutation.mutate({
            email: account.email,
            name: account.name,
            provider: socialProvider!,
            profilePicture: account.image,
            idToken: account.idToken,
            accessToken: account.accessToken
        });
        setSocialProvider(null);
    };

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            rememberMe: false
        }
    });

    const mutation = useMutation({
        mutationFn: async (data: LoginForm) => {
            const res = await api.post('/auth/login', data);
            return res.data;
        },
        onSuccess: (data) => {
            login(data.data);
            toast.success('Access Granted. Welcome back to SÉRRA FASHION STUDIO.');
            navigate('/');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Authentication failed. Please check your credentials.');
        }
    });

    const onSubmit = (data: LoginForm) => {
        mutation.mutate(data);
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side: Branding/Imagery */}
            <div className="hidden lg:flex w-1/2 bg-black relative overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1887"
                        alt="Fashion"
                        className="w-full h-full object-cover opacity-60"
                    />
                </div>
                <div className="relative z-10 w-full p-24 flex flex-col justify-between text-white">
                    <div>
                        <div className="flex flex-col">
                            <h1 className="font-serif text-6xl tracking-tight">SÉRRA</h1>
                            <span className="text-xl tracking-[0.3em] font-light mt-2 uppercase">FASHION</span>
                        </div>
                        <p className="mt-8 text-xl font-light max-w-md leading-relaxed">
                            Welcome to the next generation of digital fashion curation.
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-sm font-semibold uppercase tracking-widest text-white/60">Tier-1 Encrypted Access</p>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-md space-y-10"
                >
                    <div className="space-y-4">
                        <div className="inline-flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                            <LogIn className="h-3 w-3 text-black" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Secure Login</span>
                        </div>
                        <h2 className="text-4xl font-serif text-gray-900 leading-tight">Access Your Suite</h2>
                        <p className="text-gray-500 font-medium">Please enter your credentials to proceed.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-6">
                            <div className="relative">
                                <Input
                                    label="Email Address"
                                    placeholder="Enter your email"
                                    {...register('email')}
                                    error={errors.email?.message}
                                />
                                <Mail className="absolute right-4 top-14 h-4 w-4 text-gray-300" />
                            </div>

                            <div className="relative">
                                <Input
                                    label="Account Password"
                                    type="password"
                                    placeholder="Enter your password"
                                    {...register('password')}
                                    error={errors.password?.message}
                                />
                                <Lock className="absolute right-4 top-14 h-4 w-4 text-gray-300" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        {...register('rememberMe')}
                                    />
                                    <div className="w-5 h-5 border-2 border-gray-200 rounded-lg group-hover:border-black transition-colors peer-checked:bg-black peer-checked:border-black"></div>
                                    <ArrowRight className="absolute inset-0 h-3 w-3 m-auto text-white opacity-0 peer-checked:opacity-100 transition-opacity rotate-[-45deg]" />
                                </div>
                                <span className="text-sm font-bold text-gray-400 group-hover:text-black transition-colors">Remember my session</span>
                            </label>
                            <button type="button" className="text-sm font-bold text-black underline-offset-4 hover:underline">Trouble logging in?</button>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 text-base shadow-xl shadow-black/10 group"
                            isLoading={mutation.isPending}
                        >
                            <span>Enter SÉRRA FASHION STUDIO</span>
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </form>

                    <div className="space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                                <span className="bg-white px-4 text-gray-400">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => setSocialProvider('Google')}
                                className="flex items-center justify-center space-x-3 h-12 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all hover:border-gray-200 group"
                            >
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-4 w-4" alt="Google" />
                                <span className="text-xs font-bold text-gray-700">Google Vault</span>
                            </button>
                            {/* <button
                                onClick={() => setSocialProvider('Facebook')}
                                className="flex items-center justify-center space-x-3 h-12 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all hover:border-gray-200 group"
                            >
                                <img src="https://www.svgrepo.com/show/475643/facebook-color.svg" className="h-4 w-4" alt="Facebook" />
                                <span className="text-xs font-bold text-gray-700">Facebook Meta</span>
                            </button> */}
                        </div>
                    </div>

                    <div className="text-center pt-4">
                        <p className="text-sm text-gray-400 font-medium">
                            First time here? <Link to="/register" className="text-black font-bold hover:underline underline-offset-4">Create your invitation</Link>
                        </p>
                    </div>

                    <SocialLoginSelector
                        isOpen={!!socialProvider}
                        onClose={() => setSocialProvider(null)}
                        provider={socialProvider || 'Google'}
                        onSelect={handleSocialSelect}
                    />
                </motion.div>
            </div>
        </div>
    );
}
