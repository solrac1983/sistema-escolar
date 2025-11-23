
import React, { useState, useEffect } from 'react';
import { Lock, User, ArrowRight, School, UserPlus, ArrowLeft, Building2, Check } from 'lucide-react';
import { authenticateUser, registerUser, getOrganizations, getSystemConfig } from '../services/storageService';
import { User as UserType, Organization, SystemConfig } from '../types';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [config, setConfig] = useState<SystemConfig>(getSystemConfig());
  
  // Inputs
  const [nameInput, setNameInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  
  // Registration Specific: Organization Logic
  const [isNewOrg, setIsNewOrg] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  
  // Status
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
      // Load config initially to ensure updates from previous session
      setConfig(getSystemConfig());
      if (isRegistering) {
          setOrgs(getOrganizations());
      }
  }, [isRegistering]);

  const clearForm = () => {
    setError('');
    setSuccessMsg('');
    setNameInput('');
    setUsernameInput('');
    setPasswordInput('');
    setNewOrgName('');
    setSelectedOrgId('');
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    clearForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (!usernameInput || !passwordInput) {
        setError('Preencha usuário e senha.');
        return;
    }

    if (isRegistering) {
        if (!nameInput) { setError('Preencha seu nome.'); return; }
        if (isNewOrg && !newOrgName) { setError('Preencha o nome da nova escola.'); return; }
        if (!isNewOrg && !selectedOrgId) { setError('Selecione uma escola.'); return; }
    }

    setIsLoading(true);

    // Simulate small network delay
    setTimeout(() => {
      if (isRegistering) {
        // Register Logic
        const success = registerUser({
          username: usernameInput,
          password: passwordInput,
          name: nameInput,
          organizationName: isNewOrg ? newOrgName : '',
          existingOrgId: isNewOrg ? undefined : selectedOrgId
        });

        if (success) {
          setSuccessMsg('Cadastro realizado! Aguarde aprovação do administrador.');
          setIsRegistering(false);
          // Reset for login
          setPasswordInput('');
        } else {
          setError('Este nome de usuário já está em uso.');
        }
      } else {
        // Login Logic
        const result = authenticateUser(usernameInput, passwordInput);
        
        if (result.user) {
          // Hydrate org name locally just for display if needed before app load, 
          // though App.tsx usually handles user object
          const org = getOrganizations().find(o => o.id === result.user?.organizationId);
          const userWithOrgName: UserType = { ...result.user, organization: org ? org.name : 'Unknown' };
          onLogin(userWithOrgName);
        } else {
          setError(result.error || 'Erro ao fazer login.');
        }
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col animate-fade-in border border-slate-200">
        
        {/* Header Area - Dynamic Styles */}
        <div 
            className="p-8 text-center transition-colors duration-500"
            style={{ backgroundColor: config.loginSidebarColor }}
        >
            {config.loginLogoUrl ? (
                <div className="bg-white p-2 rounded-xl mb-4 inline-block shadow-lg">
                    <img src={config.loginLogoUrl} alt="Logo" className="h-12 object-contain" />
                </div>
            ) : (
                <div className="inline-flex p-3 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
                    {isRegistering ? <UserPlus className="w-8 h-8 text-white" /> : <School className="w-8 h-8 text-white" />}
                </div>
            )}
            
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isRegistering ? 'Solicitar Acesso' : config.loginTitle}
            </h1>
            <p className="text-white/80 text-sm mt-2">
              {isRegistering ? 'Preencha seus dados para análise' : config.loginSubtitle}
            </p>
        </div>

        {/* Form Area */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isRegistering && (
              <div className="animate-fade-in space-y-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Nome Completo</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 text-sm"
                        placeholder="Ex: Maria Silva"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Instituição</label>
                    
                    <div className="flex gap-2 mb-2">
                        <button
                            type="button"
                            onClick={() => setIsNewOrg(false)}
                            className={`flex-1 py-1.5 text-xs font-medium rounded border ${!isNewOrg ? 'bg-white border-indigo-500 text-indigo-700 shadow-sm' : 'bg-slate-100 text-slate-400 border-transparent'}`}
                        >
                            Existente
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsNewOrg(true)}
                            className={`flex-1 py-1.5 text-xs font-medium rounded border ${isNewOrg ? 'bg-white border-indigo-500 text-indigo-700 shadow-sm' : 'bg-slate-100 text-slate-400 border-transparent'}`}
                        >
                            Nova Escola
                        </button>
                    </div>

                    {isNewOrg ? (
                         <div className="relative">
                            <Building2 className="absolute top-2.5 left-3 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                className="w-full pl-9 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 text-sm"
                                placeholder="Nome da nova escola"
                                value={newOrgName}
                                onChange={(e) => setNewOrgName(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className="relative">
                             <School className="absolute top-2.5 left-3 w-4 h-4 text-slate-400" />
                            <select 
                                className="w-full pl-9 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 text-sm bg-white"
                                value={selectedOrgId}
                                onChange={(e) => setSelectedOrgId(e.target.value)}
                            >
                                <option value="">Selecione uma escola...</option>
                                {orgs.map(org => (
                                    <option key={org.id} value={org.id}>{org.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Usuário</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                  placeholder="Digite seu usuário"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 animate-pulse text-center">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg border border-green-200 animate-fade-in text-center font-medium">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{ backgroundColor: isLoading ? '#94a3b8' : config.loginButtonColor }}
              className={`w-full flex items-center justify-center py-3 px-4 rounded-lg text-white font-bold transition-all shadow-lg hover:opacity-90 transform hover:-translate-y-0.5 ${isLoading ? 'cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegistering ? 'Solicitar Cadastro' : 'Entrar'} 
                  {!isRegistering && <ArrowRight className="ml-2 w-4 h-4" />}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-100 pt-4">
             <button 
                onClick={toggleMode}
                className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors focus:outline-none"
             >
               {isRegistering ? (
                   <span className="flex items-center justify-center gap-1"><ArrowLeft className="w-3 h-3" /> Voltar para Login</span>
               ) : (
                   'Primeiro acesso? Crie sua conta'
               )}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
