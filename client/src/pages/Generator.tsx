import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircleIcon, ArrowRightIcon, CaptionsIcon, CheckIcon, Clock3Icon, ImagePlusIcon, InstagramIcon, Music2Icon, SparklesIcon, UploadCloudIcon, YoutubeIcon } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import { createProject, startVideoGeneration, uploadAssets } from '../lib/api';

const platforms = [
    { id: 'instagram', name: 'Instagram Reels', icon: InstagramIcon, ratio: '9:16' },
    { id: 'youtube', name: 'YouTube Shorts', icon: YoutubeIcon, ratio: '9:16' },
    { id: 'tiktok', name: 'TikTok', icon: Music2Icon, ratio: '9:16' },
];
const styles = ['Cinematic', 'UGC', 'Product ad', 'Animated', 'Documentary'];
const examples = [
    'A cinematic coffee ad at sunrise, warm light, slow camera push-in, steam drifting through frame',
    'A fast-paced travel reel through Tokyo at night with neon reflections and energetic cuts',
    'A clean product reveal for wireless headphones on a dark studio set with electric blue lighting',
];
type Stage = 'idle' | 'creating' | 'uploading' | 'done';

export default function Generator() {
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState('');
    const [platform, setPlatform] = useState('instagram');
    const [duration, setDuration] = useState(10);
    const [style, setStyle] = useState('Cinematic');
    const [references, setReferences] = useState<File[]>([]);
    const [captions, setCaptions] = useState(true);
    const [stage, setStage] = useState<Stage>('idle');
    const [error, setError] = useState<string | null>(null);
    const isSubmitting = stage !== 'idle';
    const selectedPlatform = platforms.find((item) => item.id === platform) ?? platforms[0];

    const handleGenerate = async (event: React.FormEvent) => {
        event.preventDefault();
        if (prompt.trim().length < 12 || isSubmitting) return;
        setError(null);
        setStage('creating');
        try {
            const title = prompt.trim().split(/\s+/).slice(0, 7).join(' ');
            const { project } = await createProject({
                productName: title,
                userPrompt: prompt.trim(),
                aspectRatio: selectedPlatform.ratio,
                productDescription: JSON.stringify({ platform, duration, style, captions }),
            });
            if (references.length) {
                setStage('uploading');
                await uploadAssets(project.id, references, 'PRODUCT_IMAGE');
            }
            await startVideoGeneration(project.id);
            setStage('done');
            navigate(`/loading/${project.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not create this video');
            setStage('idle');
        }
    };

    return (
        <main className="min-h-screen px-4 pb-24 pt-32 text-white">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-200"><SparklesIcon className="size-3.5" /> AI video studio</div>
                        <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">Turn an idea into a scroll-stopper.</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">Describe your video, choose where it will be posted, and let AI build a ready-to-share short.</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400"><span className="size-2 rounded-full bg-emerald-400" /> 20 credits available</div>
                </div>

                <form onSubmit={handleGenerate} className="grid gap-6 lg:grid-cols-[1.45fr_.75fr]">
                    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-3xl border border-white/10 bg-[#11121a]/90 shadow-2xl shadow-violet-950/20">
                        <div className="border-b border-white/8 p-5 md:p-7">
                            <label htmlFor="video-prompt" className="mb-3 block text-sm font-medium text-slate-200">What should we create?</label>
                            <textarea id="video-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={9} maxLength={1000} autoFocus placeholder="Describe the subject, action, setting, camera movement, lighting, and mood…" className="w-full resize-none bg-transparent text-lg leading-8 text-white outline-none placeholder:text-slate-600 md:text-xl" />
                            <div className="flex items-center justify-between text-xs text-slate-500"><span>{prompt.trim().length < 12 ? 'Add a little more detail to generate' : 'Your prompt is ready'}</span><span>{prompt.length}/1000</span></div>
                        </div>
                        <div className="p-5 md:p-7">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Try an idea</p>
                            <div className="grid gap-2">
                                {examples.map((example) => <button key={example} type="button" onClick={() => setPrompt(example)} className="group flex items-center justify-between gap-4 rounded-xl border border-white/7 bg-white/3 px-4 py-3 text-left text-sm text-slate-400 transition hover:border-violet-400/25 hover:bg-violet-400/5 hover:text-slate-200"><span>{example}</span><ArrowRightIcon className="size-4 shrink-0 opacity-0 transition group-hover:opacity-100" /></button>)}
                            </div>
                        </div>
                        <div className="border-t border-white/8 p-5 md:p-7">
                            <div className="mb-4 flex items-center gap-2"><ImagePlusIcon className="size-4 text-violet-300" /><span className="text-sm font-medium">Reference images</span><span className="text-xs text-slate-500">Optional</span></div>
                            <ImageUploader label="" multiple maxFiles={4} images={references} onImagesChange={setReferences} />
                        </div>
                    </motion.section>

                    <motion.aside initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }} className="h-fit rounded-3xl border border-white/10 bg-[#11121a]/90 p-5 md:p-6">
                        <h2 className="mb-6 text-lg font-semibold">Video settings</h2>
                        <div className="mb-6">
                            <p className="mb-3 text-sm text-slate-400">Publish to</p>
                            <div className="space-y-2">{platforms.map((item) => { const Icon = item.icon; const active = item.id === platform; return <button key={item.id} type="button" onClick={() => setPlatform(item.id)} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-sm transition ${active ? 'border-violet-400/40 bg-violet-500/12 text-white' : 'border-white/7 bg-white/2 text-slate-400 hover:bg-white/5'}`}><Icon className="size-4" /><span className="flex-1 text-left">{item.name}</span>{active && <CheckIcon className="size-4 text-violet-300" />}</button>; })}</div>
                        </div>
                        <div className="mb-6">
                            <div className="mb-3 flex items-center justify-between text-sm"><span className="text-slate-400">Duration</span><span>{duration} seconds</span></div>
                            <div className="grid grid-cols-3 gap-2">{[5, 10, 15].map((value) => <button key={value} type="button" onClick={() => setDuration(value)} className={`rounded-xl border py-2.5 text-sm ${duration === value ? 'border-violet-400/40 bg-violet-500/12' : 'border-white/7 bg-white/2 text-slate-400'}`}>{value}s</button>)}</div>
                        </div>
                        <div className="mb-6">
                            <p className="mb-3 text-sm text-slate-400">Visual style</p>
                            <div className="flex flex-wrap gap-2">{styles.map((item) => <button key={item} type="button" onClick={() => setStyle(item)} className={`rounded-full border px-3 py-1.5 text-xs transition ${style === item ? 'border-violet-400/40 bg-violet-500/12 text-violet-100' : 'border-white/8 text-slate-500 hover:text-slate-300'}`}>{item}</button>)}</div>
                        </div>
                        <button type="button" onClick={() => setCaptions(!captions)} className="mb-6 flex w-full items-center gap-3 rounded-xl border border-white/7 bg-white/2 p-3 text-left"><CaptionsIcon className="size-4 text-slate-400" /><span className="flex-1 text-sm text-slate-300">Auto captions</span><span className={`relative h-5 w-9 rounded-full transition ${captions ? 'bg-violet-500' : 'bg-slate-700'}`}><span className={`absolute top-0.5 size-4 rounded-full bg-white transition ${captions ? 'left-[18px]' : 'left-0.5'}`} /></span></button>
                        <div className="mb-4 flex items-center gap-4 rounded-xl bg-black/25 p-3 text-xs text-slate-400"><Clock3Icon className="size-4" /><span>Estimated generation: 2–4 minutes</span></div>
                        {error && <div className="mb-4 flex gap-2 rounded-xl border border-red-400/20 bg-red-400/8 p-3 text-sm text-red-300"><AlertCircleIcon className="mt-0.5 size-4 shrink-0" />{error}</div>}
                        <button type="submit" disabled={prompt.trim().length < 12 || isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40">{isSubmitting ? <><UploadCloudIcon className="size-4 animate-pulse" />{stage === 'uploading' ? 'Uploading references…' : 'Preparing your video…'}</> : <><SparklesIcon className="size-4" />Generate video <span className="text-slate-500">· 4 credits</span></>}</button>
                    </motion.aside>
                </form>
            </div>
        </main>
    );
}
