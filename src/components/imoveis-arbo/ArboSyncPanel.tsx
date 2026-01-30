import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ArboSyncLog } from '@/types';
import { RefreshCw, Cloud, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ArboSyncPanelProps {
    onSyncComplete: () => void;
}

export function ArboSyncPanel({ onSyncComplete }: ArboSyncPanelProps) {
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<ArboSyncLog | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load last sync info
    useEffect(() => {
        loadLastSync();
    }, []);

    const loadLastSync = async () => {
        try {
            const { data } = await supabase
                .from('arbo_sync_log')
                .select('*')
                .order('started_at', { ascending: false })
                .limit(1)
                .single();

            if (data) {
                setLastSync(data as ArboSyncLog);
            }
        } catch {
            // No previous sync
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        setError(null);

        try {
            const { data, error: fnError } = await supabase.functions.invoke('sync-arbo-imoveis', {
                method: 'POST',
            });

            if (fnError) throw fnError;

            if (data?.success) {
                await loadLastSync();
                onSyncComplete();
            } else {
                throw new Error(data?.error || 'Erro desconhecido na sincronização');
            }
        } catch (err) {
            console.error('Sync error:', err);
            setError(err instanceof Error ? err.message : 'Erro ao sincronizar');
        } finally {
            setSyncing(false);
        }
    };

    const formatSyncTime = (dateStr?: string) => {
        if (!dateStr) return 'Nunca';
        try {
            return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
        } catch {
            return 'Desconhecido';
        }
    };

    return (
        <div className="flex items-center gap-3">
            {/* Last Sync Info */}
            {lastSync && (
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
                    {lastSync.status === 'success' && (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                    )}
                    {lastSync.status === 'error' && (
                        <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    {lastSync.status === 'running' && (
                        <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
                    )}
                    <span>
                        Última sync: {formatSyncTime(lastSync.finished_at || lastSync.started_at)}
                    </span>
                    {lastSync.status === 'success' && lastSync.total_xml && (
                        <span className="text-xs opacity-70">
                            ({lastSync.total_xml} imóveis)
                        </span>
                    )}
                </div>
            )}

            {/* Sync Button */}
            <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50"
            >
                {syncing ? (
                    <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Sincronizando...
                    </>
                ) : (
                    <>
                        <Cloud className="h-4 w-4" />
                        Sincronizar Arbo
                    </>
                )}
            </button>

            {/* Error Tooltip */}
            {error && (
                <div className="absolute top-full mt-2 right-0 bg-destructive text-destructive-foreground px-3 py-2 rounded-lg text-sm max-w-xs z-50">
                    {error}
                </div>
            )}
        </div>
    );
}
