import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { tr } from '@/lib/i18n';
import { 
    UploadCloud, Link as LinkIcon, Trash2, 
    RefreshCw, ShieldCheck, Sparkles, AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { processImageFile, ImageProcessResult } from '@/lib/imageUtils';

export interface CompanyLogoUploaderProps {
    value: string;
    onChange: (val: string) => void;
    companyName?: string;
    showLetterheadMockup?: boolean;
    className?: string;
}

export const CompanyLogoUploader: React.FC<CompanyLogoUploaderProps> = ({
    value,
    onChange,
    companyName = 'Компания',
    showLetterheadMockup = false,
    className = '',
}) => {
    const [mode, setMode] = useState<'upload' | 'url'>(value && !value.startsWith('data:') ? 'url' : 'upload');
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [metaInfo, setMetaInfo] = useState<{ format?: string; sizeKb?: number; width?: number; height?: number } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        setErrorMsg(null);
        setIsProcessing(true);
        try {
            const res: ImageProcessResult = await processImageFile(file);
            onChange(res.dataUrl);
            setMetaInfo({
                format: res.format,
                sizeKb: res.sizeKb,
                width: res.width,
                height: res.height
            });
        } catch (err: any) {
            setErrorMsg(err.message || tr('Ошибка при обработке файла', 'Failed to process image file'));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await handleFile(e.target.files[0]);
        }
    };

    const handleClear = () => {
        onChange('');
        setMetaInfo(null);
        setErrorMsg(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const hasLogo = Boolean(value && value.trim());

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {tr('Логотип организации', 'Company Logo')}
                </span>
                <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs">
                    <button
                        type="button"
                        onClick={() => { setMode('upload'); setErrorMsg(null); }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                            mode === 'upload'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                    >
                        <UploadCloud className="h-3.5 w-3.5" />
                        <span>{tr('Загрузить файл', 'Upload File')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('url'); setErrorMsg(null); }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                            mode === 'url'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                    >
                        <LinkIcon className="h-3.5 w-3.5" />
                        <span>{tr('Указать ссылку (URL)', 'Link URL')}</span>
                    </button>
                </div>
            </div>

            {/* Hidden Native File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                onChange={handleFileInputChange}
                className="hidden"
                aria-label="Upload logo file"
            />

            {/* Error Message */}
            {errorMsg && (
                <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Main Interactive Controls */}
            {mode === 'upload' ? (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            fileInputRef.current?.click();
                        }
                    }}
                    className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDragging
                            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 scale-[1.01]'
                            : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/80'
                    }`}
                >
                    {isProcessing ? (
                        <div className="py-4 flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="h-7 w-7 text-blue-600 animate-spin" />
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                {tr('Оптимизация и обработка логотипа...', 'Optimizing and resizing logo...')}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-2 py-2">
                            <div className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                                <UploadCloud className="h-6 w-6" />
                            </div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {tr('Перетащите файл логотипа сюда или нажмите для выбора', 'Drag & drop logo file here, or click to browse')}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                                {tr('Поддерживаются PNG, JPG, SVG, WebP до 10 МБ. Рекомендуется PNG с прозрачным фоном.', 'Supports PNG, JPG, SVG, WebP up to 10MB. Transparent PNG recommended.')}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <Input
                            type="url"
                            value={value}
                            onChange={(e) => {
                                onChange(e.target.value);
                                setMetaInfo(null);
                                setErrorMsg(null);
                            }}
                            placeholder="https://example.com/corporate-logo.png"
                            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm"
                        />
                        {hasLogo && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClear}
                                className="shrink-0 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {tr('Укажите прямую ссылку на изображение с открытым доступом (CORS).', 'Provide a direct public URL to an image file.')}
                    </p>
                </div>
            )}

            {/* Active Logo Preview Card */}
            {hasLogo && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {tr('Активный логотип компании', 'Active Company Logo')}
                            </span>
                            {metaInfo?.sizeKb && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono">
                                    {metaInfo.format} • {metaInfo.sizeKb} KB
                                </span>
                            )}
                            {!metaInfo?.sizeKb && value.startsWith('data:') && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-mono">
                                    Base64 PNG
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="h-7 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2"
                            >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                {tr('Заменить', 'Replace')}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleClear}
                                className="h-7 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-2"
                            >
                                <Trash2 className="h-3 w-3 mr-1" />
                                {tr('Удалить', 'Remove')}
                            </Button>
                        </div>
                    </div>

                    {/* Preview box with transparency grid pattern */}
                    <div 
                        className="flex items-center justify-center p-4 rounded-lg border border-slate-200 dark:border-slate-800 max-h-36 overflow-hidden"
                        style={{
                            backgroundImage: 'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)',
                            backgroundSize: '16px 16px',
                            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                        }}
                    >
                        <img
                            src={value}
                            alt="Company logo preview"
                            className="max-h-24 max-w-full object-contain filter drop-shadow-xs"
                            onError={(e) => {
                                setErrorMsg(tr('Не удалось загрузить изображение по указанному URL', 'Failed to load image from URL'));
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                </div>
            )}

            {/* White-Label Document Letterhead Mockup Preview */}
            {showLetterheadMockup && (
                <div className="rounded-xl border border-purple-200 dark:border-purple-900/50 bg-gradient-to-br from-purple-50/40 via-white to-slate-50 dark:from-purple-950/20 dark:via-slate-900 dark:to-slate-900 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-purple-950 dark:text-purple-300">
                                {tr('White-Label: Предпросмотр на бланке PDF', 'White-Label: Official PDF Header Preview')}
                            </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold">
                            {tr('Официальный документ', 'Official Document')}
                        </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {tr(
                            'Все формируемые системой аудиторские меморандумы, сверки НСБУ/МСФО и налоговые заключения будут автоматически выпускаться с вашим фирменным корпоративным стилем:',
                            'All audit memorandums, IFRS reconciliations, and tax compliance reports exported from the platform will automatically feature your custom corporate identity:'
                        )}
                    </p>

                    {/* Paper Document Mockup Sheet */}
                    <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4 shadow-sm space-y-3">
                        {/* Top Decorative Document Bar */}
                        <div className="h-1.5 w-full bg-purple-600 rounded-full" />

                        {/* Letterhead Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-3 min-w-0">
                                {hasLogo ? (
                                    <div className="p-1 rounded-sm border border-slate-100 dark:border-slate-800 bg-white shrink-0">
                                        <img
                                            src={value}
                                            alt="Letterhead Logo"
                                            className="h-8 w-auto max-w-[120px] object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-8 px-2 rounded-sm bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 flex items-center text-[10px] text-slate-400">
                                        [Логотип компании]
                                    </div>
                                )}
                                <div>
                                    <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight truncate">
                                        {companyName || 'ООО «ТехноПром Инвест»'}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                                        {tr('Официальный аудиторский отчет • МСФО (IFRS)', 'Official Assurance Report • IFRS')}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right text-[10px] text-slate-500 shrink-0">
                                <div className="font-mono font-bold text-slate-800 dark:text-slate-200">REF: #REP-2026-A1</div>
                                <div className="text-purple-600 dark:text-purple-400 font-semibold flex items-center justify-end gap-1 mt-0.5">
                                    <ShieldCheck className="h-3 w-3" />
                                    <span>Axiaris Verified</span>
                                </div>
                            </div>
                        </div>

                        {/* Sample report body snapshot */}
                        <div className="py-1 space-y-1.5 opacity-75">
                            <div className="h-2 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xs" />
                            <div className="h-2 w-1/2 bg-slate-100 dark:bg-slate-800 rounded-xs" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
