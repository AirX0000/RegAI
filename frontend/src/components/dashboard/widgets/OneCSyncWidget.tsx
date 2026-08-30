import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '../types';
import { RefreshCw, Database, Settings, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import api from '@/lib/api';

export const OneCSyncWidget: React.FC<WidgetProps> = ({ data }) => {
    const status = data?.one_c_status;
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // Form fields
    const [url, setUrl] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [companyCode, setCompanyCode] = useState('');
    
    // Status states
    const [loadingConfig, setLoadingConfig] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const loadConfig = async () => {
        setLoadingConfig(true);
        try {
            const res = await api.get('/onec/config');
            setUrl(res.data.url || '');
            setUsername(res.data.username || '');
            setCompanyCode(res.data.company_code || '');
            // Password is kept hidden/empty for security
            setPassword('');
        } catch (error) {
            console.log("No 1C connection config found or failed to load");
        } finally {
            setLoadingConfig(false);
        }
    };

    const handleOpenDialog = () => {
        setIsDialogOpen(true);
        loadConfig();
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) {
            toast({
                title: "Error",
                description: "1C Connection URL is required",
                variant: "destructive"
            });
            return;
        }

        setSaving(true);
        try {
            await api.post('/onec/config', {
                url,
                username,
                password: password || undefined,
                company_code: companyCode
            });
            toast({
                title: "Success",
                description: "1C configuration saved successfully",
            });
            setIsDialogOpen(false);
            window.dispatchEvent(new Event('refresh-dashboard'));
        } catch (error: any) {
            toast({
                title: "Save Failed",
                description: error.response?.data?.detail || "Could not save 1C configuration",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!url) {
            toast({
                title: "Error",
                description: "1C Connection URL is required to test",
                variant: "destructive"
            });
            return;
        }

        setTesting(true);
        try {
            const res = await api.post('/onec/test', {
                url,
                username,
                password: password || undefined,
                company_code: companyCode
            });
            if (res.data.success) {
                toast({
                    title: "Success",
                    description: "1C connection test succeeded!",
                });
            } else {
                toast({
                    title: "Failed",
                    description: res.data.message || "Connection test failed",
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            toast({
                title: "Test Failed",
                description: error.response?.data?.detail || "Could not reach 1C server",
                variant: "destructive"
            });
        } finally {
            setTesting(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await api.post('/onec/sync');
            toast({
                title: "Success",
                description: "Data synchronized from 1C:Enterprise successfully",
            });
            window.dispatchEvent(new Event('refresh-dashboard'));
        } catch (error: any) {
            toast({
                title: "Sync Failed",
                description: error.response?.data?.detail || "Synchronization failed",
                variant: "destructive"
            });
        } finally {
            setSyncing(false);
        }
    };

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    1C Integration
                </CardTitle>
                <div className="flex space-x-1 items-center">
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={handleOpenDialog}
                    >
                        <Settings className="h-4 w-4" />
                    </Button>
                    <Database className="h-4 w-4 text-blue-500" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${status?.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium">{status?.connected ? 'Connected' : 'Disconnected'}</span>
                </div>

                {status?.connected && (
                    <div className="mt-2 text-xs text-muted-foreground">
                        Last sync: {status.last_sync || 'Never'}
                    </div>
                )}
                {status?.errors ? (
                    <div className="mt-1 text-xs text-red-500 font-medium">
                        Sync error detected
                    </div>
                ) : null}

                <div className="mt-4">
                    <Button 
                        onClick={handleSync}
                        disabled={syncing}
                        className="w-full flex items-center justify-center space-x-2 text-xs py-2 rounded-md transition-colors"
                        variant="secondary"
                    >
                        {syncing ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                            <RefreshCw className="h-3 w-3 mr-1" />
                        )}
                        {syncing ? 'Syncing...' : 'Sync Now'}
                    </Button>
                </div>
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>1C:Enterprise Connection</DialogTitle>
                    </DialogHeader>
                    {loadingConfig ? (
                        <div className="flex justify-center py-6 text-sm text-muted-foreground">
                            Loading configuration...
                        </div>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="url">Service OData / HTTP URL</Label>
                                <Input 
                                    id="url"
                                    placeholder="http://1c-server/base/odata/standard.odata"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input 
                                        id="username"
                                        placeholder="Admin"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input 
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="companyCode">Company Code</Label>
                                <Input 
                                    id="companyCode"
                                    placeholder="000000001"
                                    value={companyCode}
                                    onChange={(e) => setCompanyCode(e.target.value)}
                                />
                            </div>
                            
                            <DialogFooter className="pt-4 flex justify-between sm:justify-between w-full">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={handleTest}
                                    disabled={testing || saving}
                                    className="flex items-center"
                                >
                                    {testing && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                                    Test Connection
                                </Button>
                                <div className="flex space-x-2">
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        onClick={() => setIsDialogOpen(false)}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center"
                                    >
                                        {saving && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                                        Save
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
};
