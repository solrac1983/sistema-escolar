
import React, { useState, useEffect } from 'react';
import { User, UserStatus, Organization, UserRole, SystemConfig } from '../types';
import { 
    getUsers, updateUserStatus, deleteUser, saveUserFull,
    getOrganizations, createOrganization, updateOrganization, deleteOrganization,
    getSystemConfig, saveSystemConfig
} from '../services/storageService';
import { 
    CheckCircle, XCircle, Trash2, Shield, Building2, Search, 
    Plus, Edit2, X, Save, User as UserIcon, Palette, Image as ImageIcon, Settings
} from 'lucide-react';

type Tab = 'users' | 'orgs' | 'settings';

interface AdminDashboardProps {
    onConfigChange?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onConfigChange }) => {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(getSystemConfig());
  const [filter, setFilter] = useState('');
  const [configSaved, setConfigSaved] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<Partial<User> | null>(null);
  const [editOrg, setEditOrg] = useState<Partial<Organization> | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setUsers(getUsers());
    setOrgs(getOrganizations());
    setSystemConfig(getSystemConfig());
  };

  const getOrgName = (id: string) => {
      return orgs.find(o => o.id === id)?.name || 'Desconhecida';
  };

  // --- User Actions ---

  const handleUserStatusChange = (userId: string, newStatus: UserStatus) => {
    updateUserStatus(userId, newStatus);
    refreshData();
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        deleteUser(userId);
        refreshData();
    }
  };

  const openUserModal = (user?: User) => {
      setEditUser(user || { 
          name: '', username: '', role: 'user', status: 'active', organizationId: orgs[0]?.id || '' 
      });
      setEditOrg(null);
      setIsModalOpen(true);
  };

  const saveUserForm = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editUser?.name || !editUser.username || !editUser.organizationId) return;
      
      // If creating new, password is required. If editing, optional.
      if (!editUser.id && !editUser.password) {
          alert('Senha é obrigatória para novos usuários.');
          return;
      }

      const userPayload = {
          id: editUser.id || crypto.randomUUID(),
          name: editUser.name,
          username: editUser.username,
          password: editUser.password || (users.find(u => u.id === editUser.id)?.password || ''), // Keep old pass if empty
          organizationId: editUser.organizationId,
          role: editUser.role as UserRole,
          status: editUser.status as UserStatus
      };

      saveUserFull(userPayload);
      setIsModalOpen(false);
      refreshData();
  };

  // --- Org Actions ---

  const openOrgModal = (org?: Organization) => {
      setEditOrg(org || { name: '', logoUrl: '', primaryColor: '#2563eb' });
      setEditUser(null);
      setIsModalOpen(true);
  };

  const handleDeleteOrg = (id: string) => {
      if (users.some(u => u.organizationId === id)) {
          alert('Não é possível excluir uma escola que possui usuários vinculados.');
          return;
      }
      if (confirm('Excluir escola?')) {
          deleteOrganization(id);
          refreshData();
      }
  };

  const saveOrgForm = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editOrg?.name) return;

      if (editOrg.id) {
          updateOrganization(editOrg.id, editOrg.name, editOrg.logoUrl, editOrg.primaryColor);
      } else {
          createOrganization(editOrg.name, editOrg.logoUrl, editOrg.primaryColor);
      }
      setIsModalOpen(false);
      refreshData();
      
      // Notify parent to update global theme if needed
      if (onConfigChange) onConfigChange();
  };

  // --- System Config Actions ---
  const handleSystemConfigSave = (e: React.FormEvent) => {
      e.preventDefault();
      saveSystemConfig(systemConfig);
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
  };

  // --- Filtering ---

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(filter.toLowerCase()) || 
    u.username.toLowerCase().includes(filter.toLowerCase()) ||
    getOrgName(u.organizationId).toLowerCase().includes(filter.toLowerCase())
  );

  const filteredOrgs = orgs.filter(o => 
    o.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-6 h-6 text-indigo-600" />
                Painel Administrativo
            </h2>
            <p className="text-slate-500 mt-1">Controle total de usuários, organizações e sistema.</p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
            <button 
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
                Usuários
            </button>
            <button 
                 onClick={() => setActiveTab('orgs')}
                 className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'orgs' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
                Escolas
            </button>
            <button 
                 onClick={() => setActiveTab('settings')}
                 className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
                Personalização
            </button>
        </div>
      </div>

      {/* Toolbar (Only for Lists) */}
      {activeTab !== 'settings' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative flex-1 w-full max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder={activeTab === 'users' ? "Buscar usuário..." : "Buscar escola..."}
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => activeTab === 'users' ? openUserModal() : openOrgModal()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
                >
                    <Plus className="w-4 h-4" />
                    {activeTab === 'users' ? 'Novo Usuário' : 'Nova Escola'}
                </button>
            </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {activeTab === 'users' && (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3">Nome / Usuário</th>
                            <th className="px-6 py-3">Escola Vinculada</th>
                            <th className="px-6 py-3">Permissão</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                            <UserIcon className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span>{user.name}</span>
                                            <span className="text-slate-400 text-xs font-normal">@{user.username}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1 text-slate-600">
                                        <Building2 className="w-3 h-3" /> {getOrgName(user.organizationId)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                     <div className="flex items-center gap-2">
                                        {user.status === 'active' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                                        {user.status === 'pending' && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
                                        {user.status === 'blocked' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                                        <span className="capitalize text-slate-600">{user.status === 'active' ? 'Ativo' : user.status === 'pending' ? 'Pendente' : 'Bloqueado'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button onClick={() => openUserModal(user)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors" title="Editar">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    
                                    {user.status === 'pending' && (
                                        <button onClick={() => handleUserStatusChange(user.id, 'active')} className="text-green-600 hover:bg-green-50 p-1.5 rounded transition-colors" title="Aprovar">
                                            <CheckCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                    
                                    {user.id !== 'admin-id' && (
                                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors" title="Excluir">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'orgs' && (
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3">Nome da Escola</th>
                            <th className="px-6 py-3">Visual</th>
                            <th className="px-6 py-3">Usuários</th>
                            <th className="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrgs.map(org => {
                            const userCount = users.filter(u => u.organizationId === org.id).length;
                            return (
                                <tr key={org.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <div className="font-medium">{org.name}</div>
                                                <div className="text-xs font-mono text-slate-400">{org.id.slice(0, 6)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {org.logoUrl && (
                                                <img src={org.logoUrl} alt="Logo" className="w-8 h-8 object-contain bg-slate-50 rounded border border-slate-200" />
                                            )}
                                            {org.primaryColor && (
                                                <div className="w-6 h-6 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: org.primaryColor }} title={org.primaryColor}></div>
                                            )}
                                            {!org.logoUrl && !org.primaryColor && <span className="text-xs text-slate-400">-</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-medium">
                                            {userCount} usuários
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => openOrgModal(org)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteOrg(org.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="p-6 md:p-10">
                <form onSubmit={handleSystemConfigSave} className="max-w-2xl mx-auto space-y-8">
                    
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                            <Settings className="w-5 h-5 text-slate-400" /> 
                            Tela de Login
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título Principal</label>
                                    <input 
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={systemConfig.loginTitle}
                                        onChange={e => setSystemConfig({...systemConfig, loginTitle: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subtítulo</label>
                                    <input 
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={systemConfig.loginSubtitle}
                                        onChange={e => setSystemConfig({...systemConfig, loginSubtitle: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL do Logo do Sistema</label>
                                <input 
                                    type="url"
                                    placeholder="https://..."
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={systemConfig.loginLogoUrl || ''}
                                    onChange={e => setSystemConfig({...systemConfig, loginLogoUrl: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cor do Painel Lateral</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="color"
                                            className="h-10 w-10 border-0 p-0 rounded cursor-pointer"
                                            value={systemConfig.loginSidebarColor}
                                            onChange={e => setSystemConfig({...systemConfig, loginSidebarColor: e.target.value})}
                                        />
                                        <input 
                                            type="text"
                                            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                                            value={systemConfig.loginSidebarColor}
                                            onChange={e => setSystemConfig({...systemConfig, loginSidebarColor: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cor dos Botões</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="color"
                                            className="h-10 w-10 border-0 p-0 rounded cursor-pointer"
                                            value={systemConfig.loginButtonColor}
                                            onChange={e => setSystemConfig({...systemConfig, loginButtonColor: e.target.value})}
                                        />
                                        <input 
                                            type="text"
                                            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                                            value={systemConfig.loginButtonColor}
                                            onChange={e => setSystemConfig({...systemConfig, loginButtonColor: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center">
                        <span className="text-sm text-slate-500">
                            As alterações serão aplicadas na próxima vez que a página de login for carregada.
                        </span>
                        <button 
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
                        >
                            <Save className="w-4 h-4" /> 
                            {configSaved ? 'Salvo!' : 'Salvar Configuração'}
                        </button>
                    </div>
                </form>
            </div>
        )}

      </div>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">
                        {activeTab === 'users' 
                            ? (editUser?.id ? 'Editar Usuário' : 'Criar Usuário')
                            : (editOrg?.id ? 'Editar Escola' : 'Criar Escola')
                        }
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6">
                    {activeTab === 'users' && editUser && (
                        <form onSubmit={saveUserForm} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                                <input 
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={editUser.name}
                                    onChange={e => setEditUser({...editUser, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Usuário (Login)</label>
                                    <input 
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={editUser.username}
                                        onChange={e => setEditUser({...editUser, username: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                        Senha {editUser.id && <span className="text-slate-400 font-normal lowercase">(opcional)</span>}
                                    </label>
                                    <input 
                                        type="password"
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={editUser.password || ''}
                                        onChange={e => setEditUser({...editUser, password: e.target.value})}
                                        placeholder={editUser.id ? "Mudar senha..." : ""}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Escola / Empresa</label>
                                <select
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    value={editUser.organizationId}
                                    onChange={e => setEditUser({...editUser, organizationId: e.target.value})}
                                >
                                    {orgs.map(o => (
                                        <option key={o.id} value={o.id}>{o.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Permissão</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                        value={editUser.role}
                                        onChange={e => setEditUser({...editUser, role: e.target.value as UserRole})}
                                    >
                                        <option value="user">Usuário Padrão</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                        value={editUser.status}
                                        onChange={e => setEditUser({...editUser, status: e.target.value as UserStatus})}
                                    >
                                        <option value="active">Ativo</option>
                                        <option value="pending">Pendente</option>
                                        <option value="blocked">Bloqueado</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                                    <Save className="w-4 h-4" /> Salvar Usuário
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'orgs' && editOrg && (
                        <form onSubmit={saveOrgForm} className="space-y-4">
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Escola / Empresa</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Building2 className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input 
                                        className="w-full pl-9 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={editOrg.name}
                                        onChange={e => setEditOrg({...editOrg, name: e.target.value})}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL da Logo</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <ImageIcon className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input 
                                        type="url"
                                        className="w-full pl-9 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={editOrg.logoUrl || ''}
                                        onChange={e => setEditOrg({...editOrg, logoUrl: e.target.value})}
                                        placeholder="https://exemplo.com/logo.png"
                                    />
                                </div>
                                {editOrg.logoUrl && (
                                    <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200 inline-block">
                                        <img src={editOrg.logoUrl} alt="Preview" className="h-8 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cor do Tema</label>
                                <div className="flex items-center gap-3">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-300 shadow-sm">
                                        <input 
                                            type="color"
                                            className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                                            value={editOrg.primaryColor || '#2563eb'}
                                            onChange={e => setEditOrg({...editOrg, primaryColor: e.target.value})}
                                        />
                                    </div>
                                    <div className="flex-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Palette className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input 
                                            type="text"
                                            className="w-full pl-9 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                                            value={editOrg.primaryColor || '#2563eb'}
                                            onChange={e => setEditOrg({...editOrg, primaryColor: e.target.value})}
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                            </div>

                             <div className="pt-4">
                                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                                    <Save className="w-4 h-4" /> Salvar Escola
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
