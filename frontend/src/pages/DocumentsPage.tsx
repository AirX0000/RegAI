import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileText, CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export default function DocumentsPage() {
    const { user } = useAuth();
    const { i18n } = useTranslation();
    const isRu = (i18n.language || 'ru').toLowerCase().startsWith('ru');

    const [documents, setDocuments] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const res = await api.get('/documents');
            const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.items) ? res.data.items : []);
            const isSuperadmin = user?.role === 'superadmin' || user?.role === 'website_superadmin';
            const filtered = isSuperadmin 
                ? data 
                : data.filter((d: any) => !user?.company_id || d.company_id === user?.company_id);
            setDocuments(filtered);
        } catch (error) {
            console.error('Failed to fetch documents', error);
            setDocuments([]);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', docType);

        setUploading(true);
        try {
            await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast({
                title: isRu ? 'Успешно' : 'Success',
                description: isRu ? `${file.name} успешно загружен и обработан!` : `${file.name} uploaded and processed successfully!`
            });

            fetchDocuments();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: isRu ? 'Ошибка загрузки' : 'Upload Failed',
                description: error.response?.data?.detail || (isRu ? 'Не удалось загрузить документ' : 'Failed to upload document')
            });
        } finally {
            setUploading(false);
        }
    };

    const viewDocument = async (docId: string) => {
        try {
            const res = await api.get(`/documents/${docId}`);
            setSelectedDoc(res.data);
            setShowDetail(true);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: isRu ? 'Ошибка' : 'Error',
                description: isRu ? 'Не удалось загрузить данные документа' : 'Failed to load document details'
            });
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="text-green-500" size={20} />;
            case 'error': return <XCircle className="text-red-500" size={20} />;
            case 'processing': return <Loader2 className="animate-spin text-blue-500" size={20} />;
            default: return <Loader2 className="text-gray-400" size={20} />;
        }
    };

    const getDocTypeLabel = (type: string) => {
        if (!isRu) {
            switch (type) {
                case 'invoice': return 'Invoice (СФ)';
                case 'contract': return 'Contract';
                case 'bank_statement': return 'Bank Statement';
                default: return type.replace('_', ' ');
            }
        }
        switch (type) {
            case 'invoice': return 'Счёт-фактура (ЭСФ)';
            case 'contract': return 'Договор / Контракт';
            case 'bank_statement': return 'Банковская выписка';
            default: return type;
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {isRu ? 'Интеллектуальное извлечение первичных документов' : 'Smart Document Extraction'}
                </h1>
                <p className="text-gray-500 mt-1">
                    {isRu
                        ? 'Автоматическое распознавание реквизитов, сумм и НДС из сканов и электронных документов'
                        : 'Automated OCR extraction of invoice, contract, and banking details'}
                </p>
            </div>

            {/* Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['invoice', 'contract', 'bank_statement'] as const).map((type) => (
                    <div key={type} className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50/20 transition-all bg-white shadow-xs">
                        <Upload className="mx-auto mb-3 text-blue-500" size={36} />
                        <h3 className="font-semibold mb-1 text-gray-900">{getDocTypeLabel(type)}</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            {isRu ? 'Поддерживаются PDF, JPG, PNG' : 'PDF, JPG, PNG supported'}
                        </p>
                        <label className="cursor-pointer">
                            <Button disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-700">
                                {uploading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                {isRu ? `Загрузить ${getDocTypeLabel(type).split(' ')[0]}` : `Upload ${type.replace('_', ' ')}`}
                            </Button>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, type)}
                                disabled={uploading}
                            />
                        </label>
                    </div>
                ))}
            </div>

            {/* Documents List */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {isRu ? 'Загруженные первичные документы' : 'Uploaded Documents'}
                    </h2>
                    <span className="text-xs text-gray-500">
                        {documents.length} {isRu ? 'документов' : 'documents'}
                    </span>
                </div>
                <div className="divide-y">
                    {!Array.isArray(documents) || documents.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <FileText className="mx-auto mb-3 text-gray-300" size={48} />
                            <p>{isRu ? 'Документы пока не загружены' : 'No documents uploaded yet'}</p>
                        </div>
                    ) : (
                        Array.isArray(documents) && documents.map((doc) => (
                            <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-4">
                                    {getStatusIcon(doc.status)}
                                    <div>
                                        <p className="font-medium text-gray-900">{doc.filename}</p>
                                        <p className="text-sm text-gray-500">
                                            {getDocTypeLabel(doc.document_type)} • {new Date(doc.created_at).toLocaleDateString(isRu ? 'ru-RU' : 'en-US')}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => viewDocument(doc.id)}
                                    disabled={doc.status !== 'completed'}
                                >
                                    <Eye size={16} className="mr-2" />
                                    {isRu ? 'Просмотреть данные' : 'View Data'}
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedDoc?.filename}</DialogTitle>
                    </DialogHeader>
                    {selectedDoc?.extracted_data && (
                        <div className="space-y-4">
                            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm font-mono border">
                                {JSON.stringify(selectedDoc.extracted_data, null, 2)}
                            </pre>
                        </div>
                    )}
                    {selectedDoc?.error_message && (
                        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                            <p className="font-semibold">{isRu ? 'Ошибка:' : 'Error:'}</p>
                            <p>{selectedDoc.error_message}</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
