import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircleIcon, CheckIcon, FilmIcon, Layers3Icon, SparklesIcon, WandSparklesIcon } from 'lucide-react';
import { getProject, startVideoGeneration, type Project } from '../lib/api';

const steps = [
    { label: 'Understanding your prompt', icon: SparklesIcon },
    { label: 'Planning scenes and pacing', icon: Layers3Icon },
    { label: 'Generating visuals and motion', icon: WandSparklesIcon },
    { label: 'Adding captions and finishing', icon: FilmIcon },
];

export default function Loading() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [starting, setStarting] = useState(false);
    const consecutiveFailures = useRef(0);

    useEffect(() => {
        if (!projectId) return;
        let active = true;
        const poll = async () => {
            try {
                const result = await getProject(projectId);
                if (!active) return;
                consecutiveFailures.current = 0;
                setError(null);
                setProject(result.project);
                if (result.project.status === 'COMPLETED') navigate(`/results/${projectId}`, { replace: true });
                if (result.project.status === 'FAILED') setError(result.project.errorMessage || 'Generation failed');
            } catch (err) {
                if (!active) return;
                consecutiveFailures.current += 1;
                // Do not replace an already-loaded project with an error page
                // because of one transient network/authentication failure.
                if (consecutiveFailures.current >= 3) {
                    setError(err instanceof Error ? err.message : 'Could not load this project');
                }
            }
        };
        poll();
        const timer = window.setInterval(poll, 4000);
        return () => { active = false; window.clearInterval(timer); };
    }, [projectId, navigate]);

    const progress = project?.progress || (project?.status === 'PROCESSING' ? 35 : 8);
    const activeStep = Math.min(3, Math.floor(progress / 25));

    if (error) return <main className="flex min-h-screen items-center justify-center px-4"><div className="max-w-md text-center"><div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-red-400/10"><AlertCircleIcon className="size-7 text-red-300" /></div><h1 className="text-2xl font-semibold">We hit a snag</h1><p className="mt-2 text-sm text-slate-400">{error}</p><Link to="/generator" className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950">Back to studio</Link></div></main>;

    return (
        <main className="flex min-h-screen items-center justify-center px-4 py-32">
            <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#11121a]/90 p-6 md:p-10">
                <div className="mb-8 flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15"><SparklesIcon className="size-5 animate-pulse text-violet-300" /></div>
                    <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-300">Creating your video</p><h1 className="mt-1 line-clamp-2 text-xl font-semibold md:text-2xl">{project?.userPrompt || 'Loading your creative brief…'}</h1></div>
                </div>
                <div className="mb-8 h-2 overflow-hidden rounded-full bg-white/7"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-700" style={{ width: `${progress}%` }} /></div>
                <div className="space-y-2">{steps.map((step, index) => { const Icon = step.icon; const done = index < activeStep; const active = index === activeStep; return <div key={step.label} className={`flex items-center gap-3 rounded-xl border p-3 transition ${active ? 'border-violet-400/25 bg-violet-400/8' : 'border-transparent'}`}><span className={`flex size-8 items-center justify-center rounded-lg ${done ? 'bg-emerald-400/12 text-emerald-300' : active ? 'bg-violet-400/12 text-violet-300' : 'bg-white/4 text-slate-600'}`}>{done ? <CheckIcon className="size-4" /> : <Icon className="size-4" />}</span><span className={`text-sm ${done || active ? 'text-slate-200' : 'text-slate-600'}`}>{step.label}</span>{active && <span className="ml-auto size-4 animate-spin rounded-full border-2 border-violet-300 border-t-transparent" />}</div>; })}</div>
                {project?.status === 'QUEUED' && <button
                    type="button"
                    disabled={starting}
                    onClick={async () => {
                        if (!projectId) return;
                        setStarting(true);
                        try {
                            const result = await startVideoGeneration(projectId);
                            setProject(result.project);
                            setError(null);
                        } catch (err) {
                            setError(err instanceof Error ? err.message : 'Could not start video generation');
                        } finally {
                            setStarting(false);
                        }
                    }}
                    className="mt-8 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                >{starting ? 'Starting generation…' : 'Start generation'}</button>}
                <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/5 p-3 text-xs leading-5 text-amber-100/70">Your project is safely queued. This screen polls the backend and opens the finished video automatically.</div>
            </div>
        </main>
    );
}
