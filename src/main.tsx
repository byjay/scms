import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Database } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import LandingPage from './components/Login/LandingPage'
import CADSyncModal from './components/Dashboard/CADSyncModal'

const App = () => {
    const [user, setUser] = useState<any>(null)
    const [showSyncModal, setShowSyncModal] = useState(false)

    useEffect(() => {
        const savedUser = localStorage.getItem('SEASTAR_USER')
        if (savedUser) {
            setUser(JSON.parse(savedUser))
        }
    }, [])

    if (!user) {
        return <LandingPage onLoginSuccess={(u) => setUser(u)} />
    }

    // If logged in, load the dashboard
    return (
        <>
            <div className="flex items-center justify-center h-screen text-white bg-slate-900 transition-all duration-500">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">로그인 성공!</h1>
                    <p className="mb-4 font-light text-slate-300">{user.name} 사령관님, 환영합니다.</p>
                    <div className="animate-pulse text-cyan-400 mb-8">대시보드를 로드하고 있습니다...</div>

                    {/* Floating CAD Sync Trigger */}
                    <button
                        onClick={() => setShowSyncModal(true)}
                        className="flex items-center gap-2 px-8 py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-400 font-bold transition-all hover:scale-105 active:scale-95 mx-auto"
                    >
                        <Database className="w-5 h-5" />
                        CAD 데이터 연동 활성화
                    </button>

                    <script dangerouslySetInnerHTML={{
                        __html: `
                        setTimeout(() => {
                            // Load the existing dashboard scripts
                            const dashboardLink = document.createElement('link');
                            dashboardLink.rel = 'stylesheet';
                            dashboardLink.href = '/static/app.css';
                            document.head.appendChild(dashboardLink);

                            const dashboardScript = document.createElement('script');
                            dashboardScript.src = '/static/app.js';
                            document.body.appendChild(dashboardScript);

                            // Hide the React root component to let app.js take over
                            document.getElementById('root').style.display = 'none';
                            
                            // Re-mount point for dashboard
                            const appDiv = document.createElement('div');
                            appDiv.id = 'app';
                            document.body.appendChild(appDiv);
                        }, 2000);
                        `
                    }} />
                </div>
            </div>

            <AnimatePresence>
                {showSyncModal && (
                    <CADSyncModal
                        shipId="ship_default"
                        userId={user.username}
                        onClose={() => setShowSyncModal(false)}
                    />
                )}
            </AnimatePresence>
        </>
    )
}

const rootElement = document.getElementById('root')
if (rootElement) {
    createRoot(rootElement).render(<App />)
}
