import { CaptionsIcon, ClapperboardIcon, SlidersHorizontalIcon } from 'lucide-react';

export const featuresData = [
    {
        icon: <ClapperboardIcon className="w-6 h-6" />,
        title: 'Prompt to video',
        desc: 'Turn a simple idea into a complete short with scenes, pacing, camera movement, and a clear visual direction.'
    },
    {
        icon: <SlidersHorizontalIcon className="w-6 h-6" />,
        title: 'Made for every feed',
        desc: 'Choose Reels, Shorts, or TikTok and get the right aspect ratio, duration, and rhythm from the start.'
    },
    {
        icon: <CaptionsIcon className="w-6 h-6" />,
        title: 'Ready to publish',
        desc: 'Finish with automatic captions, music, and a clean MP4 you can download and share anywhere.'
    }
];

export const plansData = [
    {
        id: 'starter',
        name: 'Starter',
        price: '$10',
        desc: 'Try the platform at no cost.',
        credits: 25,
        features: [
            '25 Credits',
            'Standard quality',
            'No watermark',
            'Slower generation speed',
            'Email support'
        ]
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$29',
        desc: 'Creators and small teams.',
        credits: 80,
        features: [
            '80 Credits',
            'HD quality',
            'No watermark',
            'Email support',
            'Priority support'

        ],
        popular: true
    },
    {
        id: 'ultra',
        name: 'Ultra',
        price: '$99',
        desc: 'Scale across team and agencies.',
        credits: 300,
        features: [
            '300 Credits',
            'FHD quality',
            'No watermark',
            'Fast generation speed',
            'Chat + mail support'
        ]
    }
];

export const faqData = [
    {
        question: "How does the AI generation work?",
        answer: 'Describe the video you want and choose its format, duration, and style. The generation pipeline turns that brief into scenes, motion, captions, and a social-ready edit.'

    },
    {
        question: 'Can I use reference images?',
        answer: 'Yes. References are optional, but they can help guide the subject, product, colors, composition, or overall visual direction.'
    },
    {
        question: 'Can I cancel anytime?',
        answer: 'Yes - you can cancel from your dashboard. You will retain access through the end of your billing period.'
    },
    {
        question: 'What input formats do you support?',
        answer: 'We accept JPG, PNG and WEBP images. Outputs are high resolution PNGs and MP4 optimized for social platforms.'
    }
];

export const footerLinks = [
    {
        title: "Quick Links",
        links: [
            { name: "Home", url: "#" },
            { name: "Features", url: "#" },
            { name: "Pricing", url: "#" },
            { name: "FAQ", url: "#" }
        ]
    },
    {
        title: "Legal",
        links: [
            { name: "Privacy Policy", url: "#" },
            { name: "Terms of Service", url: "#" }
        ]
    },
    {
        title: "Connect",
        links: [
            { name: "Twitter", url: "#" },
            { name: "LinkedIn", url: "#" },
            { name: "GitHub", url: "#" }
        ]
    }
]; 
