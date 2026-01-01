import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import api from '../lib/api';
import { Send, Trash2 } from 'lucide-react';

interface CommentsProps {
    reportId: string;
}

export default function CommentsSection({ reportId }: CommentsProps) {
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (reportId) {
            fetchComments();
        }
    }, [reportId]);

    const fetchComments = async () => {
        try {
            const res = await api.get(`/reports/${reportId}/comments`);
            setComments(res.data);
        } catch (error) {
            console.error('Failed to fetch comments', error);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        setLoading(true);
        try {
            await api.post(`/reports/${reportId}/comments`, {
                comment: newComment
            });
            setNewComment('');
            toast({
                title: "Success",
                description: "Comment added",
            });
            fetchComments();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.detail || "Failed to add comment",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;

        try {
            await api.delete(`/reports/${reportId}/comments/${commentId}`);
            toast({
                title: "Success",
                description: "Comment deleted",
            });
            fetchComments();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete comment",
            });
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg">Comments</h3>

            {/* Comments List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                    <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="p-3 bg-gray-50 rounded-md border">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm">{comment.user_email}</span>
                                        <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-gray-700">{comment.comment}</p>
                                </div>
                                {(comment.user_id === user?.id || user?.role === 'admin' || user?.role === 'superadmin') && (
                                    <button
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="p-1 hover:bg-gray-200 rounded"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Comment */}
            <div className="flex gap-2">
                <textarea
                    className="flex-1 rounded-md border p-2 text-sm"
                    rows={2}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                            handleAddComment();
                        }
                    }}
                />
                <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || loading}
                    size="sm"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
            <p className="text-xs text-gray-500">Press Ctrl+Enter to send</p>
        </div>
    );
}
