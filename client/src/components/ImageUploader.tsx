import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloudIcon, XIcon } from 'lucide-react';

interface ImageUploaderProps {
    label: string;
    sublabel?: string;
    multiple?: boolean;
    images: File[];
    onImagesChange: (images: File[]) => void;
    maxFiles?: number;
}

export default function ImageUploader({
    label,
    sublabel,
    multiple = false,
    images,
    onImagesChange,
    maxFiles = 5,
}: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
        if (multiple) {
            const combined = [...images, ...imageFiles].slice(0, maxFiles);
            onImagesChange(combined);
        } else {
            onImagesChange(imageFiles.slice(0, 1));
        }
    };

    const removeImage = (index: number) => {
        onImagesChange(images.filter((_, i) => i !== index));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
                {label}
                {sublabel && <span className="text-gray-500 ml-1">{sublabel}</span>}
            </label>

            {/* Upload zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`
                    relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer
                    transition-all duration-200
                    ${isDragging
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
                    }
                `}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple={multiple}
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                />

                <UploadCloudIcon className="w-8 h-8 mx-auto mb-3 text-gray-500" />
                <p className="text-sm text-gray-400">
                    Drag & drop or <span className="text-violet-400 font-medium">browse</span>
                </p>
                <p className="text-xs text-gray-600 mt-1">
                    {multiple ? `Up to ${maxFiles} images` : 'Single image'} • PNG, JPG, WEBP
                </p>
            </div>

            {/* Preview thumbnails */}
            {images.length > 0 && (
                <div className="flex gap-3 mt-3 flex-wrap">
                    {images.map((file, i) => (
                        <motion.div
                            key={`${file.name}-${i}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative group"
                        >
                            <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/10">
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <XIcon className="w-3 h-3 text-white" />
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
