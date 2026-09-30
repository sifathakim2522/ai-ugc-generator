import { ArrowRightIcon, CheckIcon, PlayIcon, SparklesIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { assets } from '../assets/assets';

export default function Hero() {
    return (
        <section className="relative overflow-hidden px-4 pb-24 pt-36 md:pt-44">
            <div className="absolute left-1/2 top-24 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[100px]" />
            <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1fr_.82fr]">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300"><SparklesIcon className="size-3.5 text-violet-300" /> Built for the vertical video era</div>
                    <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] md:text-7xl">Your next viral video starts with <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-orange-200 bg-clip-text text-transparent">one sentence.</span></h1>
                    <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 md:text-lg">Turn any idea into polished Reels, Shorts, and TikToks—complete with scenes, motion, captions, and music.</p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link to="/generator" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-violet-100">Create your first video <ArrowRightIcon className="size-4" /></Link>
                        <button className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/4 px-6 py-3.5 text-sm text-slate-200 transition hover:bg-white/8"><PlayIcon className="size-4" /> See how it works</button>
                    </div>
                    <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">{['No editing skills', 'Platform-ready formats', 'Free credits included'].map((item) => <span key={item} className="flex items-center gap-1.5"><CheckIcon className="size-3.5 text-emerald-400" />{item}</span>)}</div>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .12 }} className="relative mx-auto w-full max-w-md">
                    <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-violet-500/20 to-fuchsia-500/5 blur-2xl" />
                    <div className="rounded-[2rem] border border-white/12 bg-[#11121a]/90 p-3 shadow-2xl">
                        <div className="relative aspect-[9/12] overflow-hidden rounded-[1.45rem] bg-black"><video src={assets.generatedVideo1} autoPlay muted loop playsInline className="h-full w-full object-cover" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-5 pt-20"><div className="mb-2 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[10px] backdrop-blur">AI GENERATED</div><p className="text-lg font-medium">Make every second impossible to skip.</p></div></div>
                        <div className="flex items-center justify-between px-2 pb-1 pt-4 text-xs text-slate-400"><span>Instagram Reel · 9:16</span><span>00:15</span></div>
                    </div>
                    <div className="absolute -left-8 top-16 rounded-2xl border border-white/10 bg-slate-950/90 p-3 shadow-xl backdrop-blur max-sm:hidden"><p className="mb-1 text-[10px] uppercase tracking-widest text-slate-500">Prompt</p><p className="max-w-40 text-xs leading-5">Cinematic product reveal with warm sunset light…</p></div>
                </motion.div>
            </div>
        </section>
    );
}
