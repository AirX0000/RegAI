import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    accept?: Record<string, string[]>;
    maxSize?: number; // in bytes
}

export const FileUpload: React.FC<FileUploadProps> = ({
    onFileSelect,
    accept = {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'text/csv': ['.csv'],
    },
    maxSize = 10 * 1024 * 1024, // 10MB
}) => {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(
        (acceptedFiles: File[], fileRejections: FileRejection[]) => {
            setError(null);

            if (fileRejections.length > 0) {
                const rejection = fileRejections[0];
                if (rejection.errors[0].code === 'file-too-large') {
                    setError(`${t('file_too_large')}. Max size is ${maxSize / 1024 / 1024}MB.`);
                } else if (rejection.errors[0].code === 'file-invalid-type') {
                    setError(t('invalid_file_type'));
                } else {
                    setError(rejection.errors[0].message);
                }
                return;
            }

            if (acceptedFiles.length > 0) {
                const selectedFile = acceptedFiles[0];
                setFile(selectedFile);
                onFileSelect(selectedFile);
            }
        },
        [maxSize, onFileSelect, t]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxSize,
        multiple: false,
    });

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile(null);
        setError(null);
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            <Card
                {...getRootProps()}
                className={cn(
                    'p-8 border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center text-center min-h-[200px]',
                    isDragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-primary/50',
                    error ? 'border-destructive/50 bg-destructive/5' : ''
                )}
            >
                <input {...getInputProps()} />

                {file ? (
                    <div className="flex items-center gap-4 p-4 bg-background rounded-lg border shadow-sm w-full max-w-sm">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <File className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 text-left overflow-hidden">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={removeFile}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                            <Upload className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-lg font-medium">
                                {isDragActive ? t('drop_file_here') : t('drag_drop_file')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {t('click_to_browse')}
                            </p>
                        </div>
                        <div className="mt-4 text-xs text-muted-foreground">
                            {t('supported_formats')}
                        </div>
                    </>
                )}
            </Card>

            {error && (
                <div className="mt-3 flex items-center gap-2 text-sm text-destructive animate-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};
