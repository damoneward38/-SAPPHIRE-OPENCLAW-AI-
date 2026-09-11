import React, { useState, useEffect } from 'react';
import { AppUser } from '../types';
import { ShieldCheck, RefreshCw, UserCheck, ShieldAlert } from 'lucide-react';

interface AdminPageProps {
  onShowToast: (msg: string, type?: 'success' | 'warn' | 'error' | 'info') => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onShowToast }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/listUsers');
      const data = await res.json();
      setUsers(data || []);
    } catch (_) {
      onShowToast('Could not fetch user registry', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSetRole = async (userId: number, role: 'admin' | 'user') => {
    try {
      await fetch('/api/admin/setRole', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role })
      });
      onShowToast(`User role updated to ${role}`, 'info');
      fetchUsers();
    } catch (_) {}
  };

  const handleSetPlan = async (userId: number, plan: 'free' | 'pro' | 'enterprise') => {
    try {
      await fetch('/api/admin/setPlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan })
      });
      onShowToast(`Plan updated to ${plan}`, 'info');
      fetchUsers();
    } catch (_) {}
  };

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const paidCount = users.filter(u => u.plan === 'pro' || u.plan === 'enterprise').length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-white sm:text-2xl font-headline">
              <ShieldCheck className="h-6 w-6 text-[#E0FF25]" /> Admin Dashboard
            </h1>
            <p className="text-xs font-medium uppercase tracking-wide text-[#a3a3a3]">
              Manage user accounts, administrative permissions, and subscription tiers.
            </p>
          </div>

          <button id="btn-adminpage-1"
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-[#E0FF25] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-black shadow transition hover:bg-[#ccff00]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3.5">
          <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-4 text-center">
            <div className="font-mono text-2xl font-black text-white">{totalUsers}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#737373]">Total Users</div>
          </div>
          <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-4 text-center">
            <div className="font-mono text-2xl font-black text-[#E0FF25]">{adminCount}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#737373]">Admins</div>
          </div>
          <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-4 text-center">
            <div className="font-mono text-2xl font-black text-white">{paidCount}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#737373]">Pro / Enterprise</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-xl border border-[#262626] bg-[#0c0c0c]">
          <div className="border-b border-[#262626] p-4 text-[10px] font-black uppercase tracking-wider text-[#a3a3a3]">
            User Accounts Registry
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#262626] bg-[#141414] text-[#a3a3a3]">
                <tr>
                  <th className="p-3.5 font-bold uppercase tracking-wider">ID</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Name</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Email</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Role</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Plan</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] text-[#a3a3a3]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-[#141414]/60">
                    <td className="p-3.5 font-mono text-[#737373]">#{u.id}</td>
                    <td className="p-3.5 font-bold text-white">{u.name}</td>
                    <td className="p-3.5 text-[#a3a3a3]">{u.email}</td>
                    <td className="p-3.5">
                      <span className={`font-bold uppercase tracking-wider text-[11px] ${u.role === 'admin' ? 'text-[#E0FF25]' : 'text-[#737373]'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        u.plan === 'enterprise' ? 'bg-[#E0FF25] text-black' :
                        u.plan === 'pro' ? 'border border-[#E0FF25] text-[#E0FF25]' : 'bg-white/5 text-[#737373]'
                      }`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {u.role !== 'admin' ? (
                          <button id="btn-adminpage-2"
                            onClick={() => handleSetRole(u.id, 'admin')}
                            className="rounded border border-[#E0FF25]/40 bg-[#E0FF25]/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#E0FF25] hover:bg-[#E0FF25]/20"
                          >
                            Make Admin
                          </button>
                        ) : (
                          <button id="btn-adminpage-3"
                            onClick={() => handleSetRole(u.id, 'user')}
                            className="rounded border border-[#262626] bg-[#141414] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#737373] hover:text-white"
                          >
                            Set User
                          </button>
                        )}

                        <button id="btn-adminpage-4"
                          onClick={() => handleSetPlan(u.id, u.plan === 'pro' ? 'enterprise' : u.plan === 'enterprise' ? 'free' : 'pro')}
                          className="rounded border border-[#262626] bg-[#141414] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white hover:border-[#E0FF25] hover:text-[#E0FF25]"
                        >
                          Cycle Plan
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
