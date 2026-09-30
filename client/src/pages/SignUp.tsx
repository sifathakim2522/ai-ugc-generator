import { SignUp } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { assets } from '../assets/assets';

export default function SignUpPage() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-12">
            <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <Link to="/" className="flex justify-center mb-8">
                    <img src={assets.logo} alt="logo" className="h-10" />
                </Link>

                {/* Sign Up Card */}
                <div className="glass-panel rounded-3xl p-8">
                    <h1 className="text-2xl font-semibold text-center mb-2">Create your account</h1>
                    <p className="text-gray-400 text-center text-sm mb-8">
                        Start creating AI-powered UGC in seconds
                    </p>

                    <SignUp
                        routing="path"
                        path="/sign-up"
                        appearance={{
                            elements: {
                                rootBox: "w-full",
                                card: "bg-transparent shadow-none",
                                headerTitle: "text-white",
                                headerSubtitle: "text-gray-400",
                                socialButtonsBlockButton: "bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl",
                                socialButtonsBlockButtonText: "text-gray-200 font-medium",
                                formFieldLabel: "text-gray-300",
                                formFieldInput: "bg-white/5 border border-white/10 text-white rounded-xl focus:border-indigo-500 focus:ring-indigo-500",
                                formButtonPrimary: "bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-medium rounded-xl transition-all",
                                footerActionLink: "text-indigo-400 hover:text-indigo-300",
                                dividerLine: "bg-white/10",
                                dividerText: "text-gray-500",
                                otpInputField: "bg-white/5 border border-white/10 text-white",
                            },
                        }}
                    />
                </div>

                {/* Footer link */}
                <p className="text-center text-sm text-gray-400 mt-6">
                    Already have an account?{' '}
                    <Link to="/sign-in" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
                        Sign in
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
