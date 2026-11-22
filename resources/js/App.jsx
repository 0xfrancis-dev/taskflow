import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { Spinner } from './components/ui';
import Landing from './pages/Landing';
import { Login, Register } from './pages/Auth';
import Contact from './pages/Contact';
import AppLayout from './pages/app/AppLayout';
import Dashboard from './pages/app/Dashboard';
import Marketplace from './pages/app/Marketplace';
import TaskDetail from './pages/app/TaskDetail';
import CreateCampaign from './pages/app/CreateCampaign';
import MyCampaigns from './pages/app/MyCampaigns';
import CampaignDetail from './pages/app/CampaignDetail';
import MySubmissions from './pages/app/MySubmissions';
import Wallet from './pages/app/Wallet';
import Referrals from './pages/app/Referrals';
import Profile from './pages/app/Profile';
import AdminLayout from './pages/admin/AdminLayout';
import { Overview, Users, Campaigns, Withdrawals, Deposits, Messages } from './pages/admin/AdminPages';

function Guard({ admin = false }) {
    const { user, booting } = useApp();
    const loc = useLocation();
    if (booting) return <div className="grid min-h-screen place-items-center"><Spinner /></div>;
    if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
    if (admin && user.role !== 'admin') return <Navigate to="/app" replace />;
    return <Outlet />;
}

function ScrollTop() {
    const { pathname } = useLocation();
    useEffect(() => window.scrollTo(0, 0), [pathname]);
    return null;
}

export default function App() {
    return (
        <>
            <ScrollTop />
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route element={<Guard />}>
                    <Route path="/app" element={<AppLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="tasks" element={<Marketplace />} />
                        <Route path="tasks/:id" element={<TaskDetail />} />
                        <Route path="campaigns" element={<MyCampaigns />} />
                        <Route path="campaigns/new" element={<CreateCampaign />} />
                        <Route path="campaigns/:id" element={<CampaignDetail />} />
                        <Route path="submissions" element={<MySubmissions />} />
                        <Route path="wallet" element={<Wallet />} />
                        <Route path="referrals" element={<Referrals />} />
                        <Route path="profile" element={<Profile />} />
                    </Route>
                </Route>

                <Route element={<Guard admin />}>
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<Overview />} />
                        <Route path="users" element={<Users />} />
                        <Route path="campaigns" element={<Campaigns />} />
                        <Route path="withdrawals" element={<Withdrawals />} />
                        <Route path="deposits" element={<Deposits />} />
                        <Route path="messages" element={<Messages />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}
