import React, { useState, useEffect } from 'react';
import { X, Cloud, Trash2, Key } from 'lucide-react';
import { 
  getStoredFirebaseConfig, 
  saveStoredFirebaseConfig, 
  removeStoredFirebaseConfig 
} from '@/lib/storageService';
import { isFirebaseConfigured } from '@/lib/firebase';
import { FirebaseConfig } from '@/lib/types';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export function FirebaseModal({
  isOpen,
  onClose,
  onConfigSaved,
}: FirebaseModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredFirebaseConfig();
      if (stored) {
        setApiKey(stored.apiKey || '');
        setAuthDomain(stored.authDomain || '');
        setProjectId(stored.projectId || '');
        setStorageBucket(stored.storageBucket || '');
        setMessagingSenderId(stored.messagingSenderId || '');
        setAppId(stored.appId || '');
      } else {
        setApiKey(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '');
        setAuthDomain(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '');
        setProjectId(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '');
        setStorageBucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '');
        setMessagingSenderId(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '');
        setAppId(process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '');
      }
      setIsConfigured(isFirebaseConfigured());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      alert('Preencha ao menos a apiKey e o projectId');
      return;
    }

    const config: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    saveStoredFirebaseConfig(config);
    onConfigSaved();
    onClose();
  };

  const handleRemove = () => {
    if (confirm('Deseja remover as credenciais locais do Firebase e voltar para o modo offline?')) {
      removeStoredFirebaseConfig();
      setApiKey('');
      setAuthDomain('');
      setProjectId('');
      setStorageBucket('');
      setMessagingSenderId('');
      setAppId('');
      onConfigSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="w-full max-w-lg bg-[#0c0c0e] border border-zinc-800 p-5 sm:p-6 text-zinc-100 rounded-none shadow-2xl font-mono text-xs my-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-none inline-block" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Conexão em Nuvem (Firebase)
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 text-zinc-500 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status */}
        <div className="mt-4 p-3 border border-zinc-800 bg-[#131317] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-orange-500'}`} />
            <span className="font-bold text-zinc-200 uppercase">
              {isConfigured ? 'Firebase Conectado' : 'Armazenamento Local'}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 uppercase">
            {isConfigured ? 'Sincronização Ativa' : 'Apenas este aparelho'}
          </span>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSave} className="space-y-3 mt-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
              API Key (apiKey)
            </label>
            <input
              type="text"
              required
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#131317] border border-zinc-750 text-zinc-200 font-mono text-xs focus:border-orange-500 focus:outline-none rounded-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                Project ID
              </label>
              <input
                type="text"
                required
                placeholder="contas-leeo-marii"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#131317] border border-zinc-750 text-zinc-200 font-mono text-xs focus:border-orange-500 focus:outline-none rounded-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                Auth Domain
              </label>
              <input
                type="text"
                placeholder="contas-leeo-marii.firebaseapp.com"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#131317] border border-zinc-750 text-zinc-200 font-mono text-xs focus:border-orange-500 focus:outline-none rounded-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            {isConfigured ? (
              <button
                type="button"
                onClick={handleRemove}
                className="text-red-400 hover:text-red-300 text-[11px] uppercase tracking-wider font-semibold"
              >
                Desconectar
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-zinc-800 text-zinc-400 hover:text-zinc-200 uppercase tracking-wider text-[11px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-400 text-black font-bold uppercase tracking-wider text-[11px]"
              >
                Salvar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
