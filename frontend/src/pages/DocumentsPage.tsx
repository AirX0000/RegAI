import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileText, CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function DocumentsPage() {
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
            setDocuments(res.data);
        } catch (error) {
            console.error('Failed to fetch documents', error);
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
                title: 'Success',
                description: `${file.name} uploaded and processed successfully!`
            });

            fetchDocuments();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: error.response?.data?.detail || 'Failed to upload document'
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
                title: 'Error',
                description: 'Failed to load document details'
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

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Smart Document Extraction</h1>

            {/* Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {['invoice', 'contract', 'bank_statement'].map((type) => (
                    <div key={type} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                        <Upload className="mx-auto mb-3 text-gray-400" size={40} />
                        <h3 className="font-semibold mb-2 capitalize">{type.replace('_', ' ')}</h3>
                        <label className="cursor-pointer">
                            <Button disabled={uploading} className="w-full">
                                {uploading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                Upload {type.split('_')[0]}
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
            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-semibold">Uploaded Documents</h2>
                </div>
                <div className="divide-y">
                    {documents.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <FileText className="mx-auto mb-3 text-gray-300" size={48} />
                            <p>No documents uploaded yet</p>
                        </div>
                    ) : (
                        documents.map((doc) => (
                            <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center space-x-4">
                                    {getStatusIcon(doc.status)}
                                    <div>
                                        <p className="font-medium">{doc.filename}</p>
                                        <p className="text-sm text-gray-500">
                                            {doc.document_type} • {new Date(doc.created_at).toLocaleDateString()}
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
                                    View Data
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
                            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                                {JSON.stringify(selectedDoc.extracted_data, null, 2)}
                            </pre>
                        </div>
                    )}
                    {selectedDoc?.error_message && (
                        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                            <p className="font-semibold">Error:</p>
                            <p>{selectedDoc.error_message}</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
