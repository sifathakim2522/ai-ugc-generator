import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, FilmIcon, PlusIcon } from 'lucide-react';
import { listProjects, type Project } from '../lib/api';

export default function MyGenerations() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => { listProjects().then(({ projects }) => setProjects(projects)).finally(() => setLoading(false)); }, []);
    return <main className="min-h-screen px-4 pb-24 pt-32"><div className="mx-auto max-w-6xl"><div className="mb-8 flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-300">Your workspace</p><h1 className="mt-2 text-4xl font-semibold">My videos</h1></div><Link to="/generator" className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950"><PlusIcon className="size-4" />Create video</Link></div>
        {loading ? <p className="text-sm text-slate-500">Loading projects…</p> : projects.length === 0 ? <div className="rounded-3xl border border-dashed border-white/12 py-24 text-center"><FilmIcon className="mx-auto size-8 text-slate-600" /><h2 className="mt-4 text-lg font-medium">No videos yet</h2><p className="mt-2 text-sm text-slate-500">Your generated shorts will live here.</p><Link to="/generator" className="mt-6 inline-flex items-center gap-2 text-sm text-violet-300">Create your first video <ArrowRightIcon className="size-4" /></Link></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.map((project) => <Link key={project.id} to={project.status === 'COMPLETED' ? `/results/${project.id}` : `/loading/${project.id}`} className="group overflow-hidden rounded-2xl border border-white/8 bg-white/3 transition hover:-translate-y-1 hover:border-white/15"><div className="flex aspect-video items-center justify-center bg-gradient-to-br from-violet-950/70 to-slate-950">{project.generatedImageUrl ? <img src={project.generatedImageUrl} alt="" className="h-full w-full object-cover" /> : <FilmIcon className="size-8 text-violet-300/50" />}</div><div className="p-4"><div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-500"><span>{project.aspectRatio}</span><span>{project.status}</span></div><p className="line-clamp-2 text-sm leading-6 text-slate-200">{project.userPrompt}</p></div></Link>)}</div>}
    </div></main>;
}
