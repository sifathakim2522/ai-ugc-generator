import { MenuIcon, XIcon, SparklesIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PrimaryButton } from './Buttons';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { assets } from '../assets/assets';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Create', href: '/generator' },
        { name: 'My videos', href: '/my-generations' },
        { name: 'Community', href: '/community' },
    ];

    return <motion.nav className="fixed left-0 right-0 top-5 z-50 px-4" initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 250, damping: 70 }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-white/4 bg-black/50 p-3 backdrop-blur-md">
            <Link to="/" onClick={() => scrollTo(0, 0)}><img src={assets.logo} alt="UGC.AI" className="h-8" /></Link>
            <div className="hidden items-center gap-8 text-sm font-medium text-gray-300 md:flex">{navLinks.map((link) => <Link onClick={() => scrollTo(0, 0)} to={link.href} key={link.name} className="transition hover:text-white">{link.name}</Link>)}</div>
            <div className="hidden md:block"><Link to="/generator"><PrimaryButton><SparklesIcon className="size-4" />Create video</PrimaryButton></Link></div>
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden"><MenuIcon className="size-6" /></button>
        </div>
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/90 text-lg font-medium backdrop-blur-md transition-all duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            {navLinks.map((link) => <Link key={link.name} to={link.href} onClick={() => setIsOpen(false)}>{link.name}</Link>)}
            <Link to="/generator" onClick={() => setIsOpen(false)}><PrimaryButton><SparklesIcon className="size-4" />Create video</PrimaryButton></Link>
            <button onClick={() => setIsOpen(false)} className="rounded-md bg-white p-2 text-gray-800"><XIcon /></button>
        </div>
    </motion.nav>;
}
