import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import RedTeamConsole from './pages/RedTeamConsole'
import ActivityFeed from './pages/ActivityFeed'
import AttackerIntel from './pages/AttackerIntel'
import VulnerableApp from './pages/VulnerableApp'

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="red-team" element={<RedTeamConsole />} />
                    <Route path="feed" element={<ActivityFeed />} />
                    <Route path="intel" element={<AttackerIntel />} />
                    <Route path="target" element={<VulnerableApp />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}
