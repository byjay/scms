import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertTriangle, Loader2, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CADSyncModalProps {
    shipId: string;
    userId: string;
    onClose: () => void;
    onSyncSuccess?: (data: any) => void;
}

const CADSyncModal: React.FC<CADSyncModalProps> = ({ shipId, userId, onClose, onSyncSuccess }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [syncSummary, setSyncSummary] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState('');

    const handleFileUpload = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setSyncStatus('idle');

        // In a real scenario, we would upload the file to a server endpoint that runs the Python script.
        // For this demonstration, we'll simulate the process and call the /api/cad/sync endpoint
        // with mock data extracted from a hypothetical file service.

        try {
            // Simulate extraction delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            const response = await fetch('/api/cad/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shipId,
                    userId,
                    networkData: {
                        summary: { total_nodes: 42, horizontal_edges: 38, vertical_edges: 4 },
                        edges: [],
                        nodes: []
                    }
                })
            });

            const result = await response.json() as any;
            if (result.success) {
                setSyncStatus('success');
                setSyncSummary(result.summary);
                if (onSyncSuccess) onSyncSuccess(result);
            } else {
                setSyncStatus('error');
                setErrorMessage(result.error || '동기화 중 오류가 발생했습니다.');
            }
        } catch (err) {
            setSyncStatus('error');
            setErrorMessage('서버와의 통신에 실패했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-xl font-bold text-white">CAD 데이터 연동</h2>
                    </div>
                    <button
                        onClick={onClose}
                        title="닫기"
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="p-8">
                    {syncStatus === 'idle' && !isUploading && (
                        <div className="text-center">
                            <div className="mb-6 flex justify-center">
                                <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center">
                                    <Upload className="w-10 h-10 text-cyan-400" />
                                </div>
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">DXF 파일 업로드</h3>
                            <p className="text-slate-400 text-sm mb-6">
                                레이어와 블록 속성이 정의된 DXF 파일을 업로드하여<br />
                                디지털 트윈 데이터를 즉시 갱신합니다.
                            </p>

                            <label className="block">
                                <span className="sr-only">파일 선택</span>
                                <input
                                    type="file"
                                    accept=".dxf"
                                    onChange={handleFileUpload}
                                    className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2.5 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-cyan-500 file:text-white
                    hover:file:bg-cyan-600
                    cursor-pointer"
                                />
                            </label>
                        </div>
                    )}

                    {isUploading && (
                        <div className="text-center py-8">
                            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">데이터 분석 중...</h3>
                            <p className="text-slate-400 text-sm">
                                CAD 도면에서 노드 좌표와 경로 정보를 추출하고 있습니다.<br />
                                잠시만 기다려 주십시오.
                            </p>
                        </div>
                    )}

                    {syncStatus === 'success' && (
                        <div className="text-center">
                            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">동기화 완료!</h3>
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 mb-6 text-left">
                                <div className="flex justify-between text-sm py-1">
                                    <span className="text-slate-400">추출된 노드 수</span>
                                    <span className="text-emerald-400 font-bold">{syncSummary?.total_nodes} EA</span>
                                </div>
                                <div className="flex justify-between text-sm py-1">
                                    <span className="text-slate-400">연결된 경로 수</span>
                                    <span className="text-emerald-400 font-bold">{syncSummary?.horizontal_edges + syncSummary?.vertical_edges} EA</span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
                            >
                                닫기
                            </button>
                        </div>
                    )}

                    {syncStatus === 'error' && (
                        <div className="text-center">
                            <AlertTriangle className="w-16 h-16 text-rose-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">오류 발생</h3>
                            <p className="text-rose-400 text-sm mb-6">{errorMessage}</p>
                            <button
                                onClick={() => setSyncStatus('idle')}
                                className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold transition-colors"
                            >
                                다시 시도
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CADSyncModal;
