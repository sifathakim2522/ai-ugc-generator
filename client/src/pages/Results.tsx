import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, DownloadIcon, RefreshCwIcon, Share2Icon, SparklesIcon } from 'lucide-react';
import { getProject, type Project } from '../lib/api';

export default function Results() {
    const { projectId } = useParams<{ projectId: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => { if (projectId) getProject(projectId).then(({ project }) => setProject(project)).catch((err) => setError(err.message)); }, [projectId]);
    if (error) return <main className="min-h-screen px-4 pt-36 text-center text-red-300">{error}</main>;
    if (!project) return <main className="min-h-screen px-4 pt-36 text-center text-slate-500">Loading video…</main>;

    return <main className="min-h-screen px-4 pb-24 pt-32"><div className="mx-auto max-w-6xl"><Link to="/my-generations" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeftIcon className="size-4" />Back to my videos</Link><div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
        <div className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl"><div className="aspect-[9/16]">{project.generatedVideoUrl ? <video src={project.generatedVideoUrl} controls autoPlay loop className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center p-8 text-center"><SparklesIcon className="mb-4 size-8 text-violet-300" /><p className="font-medium">Video output is not available yet</p><p className="mt-2 text-sm text-slate-500">The project exists, but a generation provider still needs to finish it.</p></div>}</div></div>
        <div className="py-4"><span className="rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3 py-1 text-xs text-emerald-300">{project.status}</span><h1 className="mt-5 text-3xl font-semibold">Your video is ready to move.</h1><p className="mt-4 leading-7 text-slate-400">{project.userPrompt}</p><div className="mt-8 grid grid-cols-2 gap-3"><a href={project.generatedVideoUrl || undefined} download className={`flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 ${!project.generatedVideoUrl ? 'pointer-events-none opacity-40' : ''}`}><DownloadIcon className="size-4" />Download</a><button className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm"><Share2Icon className="size-4" />Share</button></div><div className="mt-3 grid grid-cols-2 gap-3"><Link to="/generator" className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm"><SparklesIcon className="size-4" />New video</Link><button className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm"><RefreshCwIcon className="size-4" />Regenerate</button></div></div>
    </div></div></main>;
}
