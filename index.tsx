import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Home, ClipboardList, LifeBuoy, User, PlusCircle, Search, 
  ArrowLeft, Camera, Send, CheckCircle2, Phone, MessageCircle, 
  AlertTriangle, Star, Shield, Mail, X, Trophy, Bell, BellOff, 
  ListChecks, LogOut, ThumbsUp, Heart, Zap, UserCheck, Info
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- Tipos e Constantes ---

const DocType = {
  BI: 'Bilhete de Identidade',
  DIRE: 'DIRE',
  PASSPORT: 'Passaporte',
  LICENSE: 'Carta de Condução',
  NUIT: 'NUIT',
  OUTRO: 'Outro'
} as const;

const Province = {
  MAPUTO_CIDADE: 'Maputo Cidade',
  MAPUTO_PROVINCIA: 'Maputo Província',
  GAZA: 'Gaza',
  INHAMBANE: 'Inhambane',
  SOFALA: 'Sofala',
  MANICA: 'Manica',
  TETE: 'Tete',
  ZAMBEZIA: 'Zambézia',
  NAMPULA: 'Nampula',
  NIASSA: 'Niassa',
  CABO_DELGADO: 'Cabo Delgado'
} as const;

const MOZ_PHRASES = [
  "A solidariedade une Moçambique.",
  "Recuperando o que é seu.",
  "Honestidade em primeiro lugar.",
  "Viva Moçambique!",
  "Ajudando uns aos outros, sempre."
];

const FLAG_URL = "https://flagcdn.com/w640/mz.png";

// --- App Principal ---

function App() {
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('home');
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('achei_moz_docs');
    return saved ? JSON.parse(saved) : [];
  });
  const [pushMessages, setPushMessages] = useState([]);
  const [successModal, setSuccessModal] = useState<{ show: boolean; type?: string; data?: any }>({ show: false });
  const [currentPhrase, setCurrentPhrase] = useState(0);

  useEffect(() => {
    localStorage.setItem('achei_moz_docs', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    const phraseInterval = setInterval(() => setCurrentPhrase(p => (p + 1) % MOZ_PHRASES.length), 2500);
    const timer = setTimeout(() => setLoading(false), 3500);
    return () => { clearTimeout(timer); clearInterval(phraseInterval); };
  }, []);

  const triggerPush = (text: string) => {
    const id = Date.now();
    setPushMessages((prev: any) => [...prev, { id, text }]);
    setTimeout(() => setPushMessages((prev: any) => prev.filter((m: any) => m.id !== id)), 6000);
  };

  const handleAddDocument = (entry: any) => {
    const newDoc = { 
      ...entry, 
      id: Math.random().toString(36).substr(2, 9), 
      createdAt: Date.now() 
    };
    
    // Lógica de Notificação Push Simulado
    if (newDoc.status === 'encontrei') {
      const match = documents.find((d: any) => d.status === 'perdi' && d.number.trim().toUpperCase() === newDoc.number.trim().toUpperCase());
      if (match) {
        triggerPush(`ALERTA: Documento de ${match.name} acaba de ser localizado!`);
      }
    } else {
      const match = documents.find((d: any) => d.status === 'encontrei' && d.number.trim().toUpperCase() === newDoc.number.trim().toUpperCase());
      if (match) {
        triggerPush(`BOAS NOTÍCIAS: Seu documento já foi encontrado por ${match.name}!`);
        setSuccessModal({ show: true, type: 'already_found', data: { ...newDoc, finder: match } });
        return;
      }
    }

    setDocuments((prev: any) => [newDoc, ...prev]);
    setSuccessModal({ show: true, type: entry.status, data: newDoc });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 mesh-bg flex flex-col items-center justify-center p-8 overflow-hidden z-[100]">
        <img src={FLAG_URL} className="absolute w-[150%] opacity-10 blur-[1px] animate-float-flag" alt="Flag Background" />
        <div className="relative z-10 flex flex-col items-center space-y-12 text-center w-full max-w-xs">
          <div className="w-24 h-24 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-moz-red rounded-3xl transform -rotate-12 border-2 border-white shadow-sm" />
            <div className="absolute inset-0 bg-moz-green rounded-3xl transform rotate-12 opacity-80 border-2 border-white" />
            <span className="relative z-10 text-white font-black text-sm drop-shadow-md">ACHEI MOZ</span>
          </div>
          <div className="space-y-4">
            <p className="text-2xl font-black text-white drop-shadow-2xl animate-soft-pulse uppercase tracking-tighter">
              {MOZ_PHRASES[currentPhrase]}
            </p>
            <p className="text-moz-yellow text-[10px] font-bold uppercase tracking-[0.3em] opacity-80">Carregando solidariedade...</p>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden backdrop-blur-md border border-white/10">
            <div className="bg-moz-yellow h-full transition-all duration-[3500ms] ease-linear w-full shadow-[0_0_15px_#FFD200]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white max-w-md mx-auto shadow-2xl relative overflow-hidden text-gray-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-moz-red rounded-lg transform -rotate-12 border border-white shadow-sm" />
            <div className="absolute inset-0 bg-moz-green rounded-lg transform rotate-12 opacity-80 border border-white" />
            <span className="relative z-10 text-white font-black text-[6px]">AM</span>
          </div>
          <h1 className="font-black text-xl tracking-tight text-moz-black">
            ACHEI <span className="text-moz-red">MOZ</span>
          </h1>
        </div>
        <img src={FLAG_URL} className="w-6 h-4 rounded shadow-sm border border-gray-100 object-cover" alt="Moz Flag" />
      </header>

      {/* View Content */}
      <main className="flex-1 overflow-y-auto pb-24 hide-scrollbar bg-gray-50/30">
        {activeView === 'home' && <HomeView setActiveView={setActiveView} documents={documents} />}
        {activeView === 'mural' && <MuralView documents={documents} />}
        {activeView === 'form_perdi' && <DocumentForm type="perdi" onClose={() => setActiveView('home')} onSubmit={handleAddDocument} />}
        {activeView === 'form_encontrei' && <DocumentForm type="encontrei" onClose={() => setActiveView('home')} onSubmit={handleAddDocument} />}
        {activeView === 'info' && <InfoView onClose={() => setActiveView('home')} />}
      </main>

      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-xl border-t border-gray-100 py-3 px-8 flex justify-between items-center fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] rounded-t-[32px]">
        <NavButton active={activeView === 'home'} icon={<Home size={22} />} label="Início" onClick={() => setActiveView('home')} />
        <NavButton active={activeView === 'mural'} icon={<ClipboardList size={22} />} label="Mural" onClick={() => setActiveView('mural')} />
        <NavButton active={activeView === 'info'} icon={<Info size={22} />} label="Ajuda" onClick={() => setActiveView('info')} />
        <NavButton active={false} icon={<User size={22} />} label="Conta" onClick={() => alert("Módulo de Perfil em desenvolvimento!")} />
      </nav>

      {/* Notifications Overlay */}
      <div className="fixed top-4 left-0 right-0 z-[110] px-6 pointer-events-none max-w-md mx-auto">
        {pushMessages.map((m: any) => (
          <div key={m.id} className="bg-moz-black text-white p-4 rounded-2xl shadow-2xl border-l-8 border-moz-yellow mb-2 animate-push flex items-center space-x-4 pointer-events-auto">
            <div className="p-2 bg-moz-yellow/20 rounded-full">
               <Bell className="text-moz-yellow shrink-0" size={20} />
            </div>
            <p className="text-xs font-black uppercase tracking-tight">{m.text}</p>
          </div>
        ))}
      </div>

      {/* Modal Success */}
      {successModal.show && (
        <SuccessModal 
          type={successModal.type} 
          data={successModal.data} 
          onClose={() => { setSuccessModal({ show: false }); setActiveView('mural'); }} 
        />
      )}
    </div>
  );
}

// --- Sub-Componentes ---

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center space-y-1 transition-all ${active ? 'text-moz-red scale-110' : 'text-gray-400'}`}>
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function HomeView({ setActiveView, documents }: any) {
  const recentCount = documents.length;
  
  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative h-64 rounded-[48px] overflow-hidden shadow-2xl flex items-end">
        <div className="absolute inset-0 bg-gradient-to-tr from-moz-black via-moz-black/80 to-moz-red/40" />
        <img src="https://images.unsplash.com/photo-1516245834210-c4c142787335?q=80&w=1000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay" alt="Mozambique" />
        <div className="relative z-10 w-full p-8 space-y-4">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-6 rounded-[32px] shadow-2xl">
            <p className="text-[10px] font-black text-moz-yellow uppercase tracking-[0.4em] mb-2">Moçambique Unido</p>
            <h2 className="text-4xl font-black text-white leading-none uppercase tracking-tighter mb-2">
              ACHEI <span className="text-moz-yellow">MOZ</span>
            </h2>
            <div className="h-1 w-12 bg-moz-yellow mb-3 rounded-full" />
            <p className="text-white/80 font-bold text-xs uppercase leading-relaxed">
              A maior rede solidária de recuperação de documentos em Moçambique.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => setActiveView('form_perdi')} 
          className="group relative overflow-hidden bg-moz-red text-white p-8 rounded-[40px] flex items-center justify-between shadow-xl active:scale-95 transition-all"
        >
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          <div className="text-left relative z-10">
            <span className="block text-2xl font-black uppercase tracking-tighter">Perdi algo</span>
            <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">Registrar perda</span>
          </div>
          <div className="bg-white/20 p-4 rounded-3xl relative z-10">
            <Search className="w-6 h-6" />
          </div>
        </button>

        <button 
          onClick={() => setActiveView('form_encontrei')} 
          className="group relative overflow-hidden bg-moz-green text-white p-8 rounded-[40px] flex items-center justify-between shadow-xl active:scale-95 transition-all"
        >
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          <div className="text-left relative z-10">
            <span className="block text-2xl font-black uppercase tracking-tighter">Achei algo</span>
            <span className="text-white/70 text-[10px] font-black uppercase tracking-widest">Fazer o bem</span>
          </div>
          <div className="bg-white/20 p-4 rounded-3xl relative z-10">
            <PlusCircle className="w-6 h-6" />
          </div>
        </button>
      </div>

      {recentCount > 0 && (
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Atividade Recente</h3>
            <span className="text-[10px] font-black bg-gray-100 px-2 py-1 rounded-full text-gray-500">{recentCount} REGISTROS</span>
          </div>
          <div className="flex space-x-3 overflow-x-auto pb-4 hide-scrollbar">
            {documents.slice(0, 5).map((doc: any) => (
              <div key={doc.id} className="min-w-[140px] bg-white border border-gray-100 p-4 rounded-3xl shadow-sm space-y-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${doc.status === 'perdi' ? 'bg-moz-red/10 text-moz-red' : 'bg-moz-green/10 text-moz-green'}`}>
                  {doc.status === 'perdi' ? <Search size={14} /> : <CheckCircle2 size={14} />}
                </div>
                <p className="text-[10px] font-black uppercase truncate">{doc.name}</p>
                <p className="text-[8px] font-bold text-gray-400 uppercase">{doc.type}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MuralView({ documents }: any) {
  const [filter, setFilter] = useState('');
  
  const filteredDocs = useMemo(() => {
    if (!filter) return documents;
    const lower = filter.toLowerCase();
    return documents.filter((d: any) => 
      d.name.toLowerCase().includes(lower) || 
      d.number.toLowerCase().includes(lower) ||
      d.type.toLowerCase().includes(lower)
    );
  }, [filter, documents]);

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Mural</h2>
        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Encontre o que você procura</p>
      </div>

      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-moz-red transition-colors" size={20} />
        <input 
          type="text"
          placeholder="PESQUISAR POR NOME OU NÚMERO..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-gray-100/50 border-2 border-transparent focus:border-moz-red/20 focus:bg-white p-5 pl-14 rounded-[32px] font-black text-xs uppercase tracking-widest outline-none transition-all"
        />
      </div>

      <div className="space-y-4">
        {filteredDocs.length === 0 ? (
          <div className="py-20 text-center space-y-4 opacity-30">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <ClipboardList size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-400 font-black text-xs uppercase tracking-widest">Nenhum registro encontrado</p>
          </div>
        ) : (
          filteredDocs.map((doc: any) => (
            <div key={doc.id} className="doc-card bg-white p-6 rounded-[40px] shadow-sm border border-gray-100 flex items-start space-x-5">
              <div className={`p-4 rounded-2xl shrink-0 ${doc.status === 'perdi' ? 'bg-moz-red/10 text-moz-red' : 'bg-moz-green/10 text-moz-green'}`}>
                {doc.status === 'perdi' ? <Search size={24} /> : <CheckCircle2 size={24} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${doc.status === 'perdi' ? 'bg-moz-red/10 text-moz-red' : 'bg-moz-green/10 text-moz-green'}`}>
                    {doc.status === 'perdi' ? 'Procura-se' : 'Encontrado'}
                  </span>
                  <span className="text-[8px] font-bold text-gray-300 uppercase">
                    {new Date(doc.createdAt).toLocaleDateString('pt-MZ')}
                  </span>
                </div>
                <p className="font-black text-gray-900 uppercase text-lg leading-tight truncate">{doc.name}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  {doc.type} • {doc.province}
                </p>
                
                <div className="flex items-center space-x-2">
                   <button 
                    onClick={() => alert(`Contactando ${doc.name}...`)}
                    className="flex-1 bg-gray-900 text-white py-3 rounded-2xl flex items-center justify-center space-x-2 text-[10px] font-black uppercase active:scale-95 transition-transform"
                   >
                     <Phone size={14} />
                     <span>Contactar</span>
                   </button>
                   <button 
                    onClick={() => alert(`Enviando mensagem para ${doc.contact}...`)}
                    className="p-3 bg-moz-green/10 text-moz-green rounded-2xl active:scale-95 transition-transform"
                   >
                     <MessageCircle size={14} />
                   </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DocumentForm({ type, onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({ 
    name: '', 
    type: DocType.BI, 
    number: '', 
    province: Province.MAPUTO_CIDADE, 
    location: '', 
    contact: '' 
  });

  const isValid = formData.name.length > 3 && formData.number.length > 5 && formData.contact.length >= 9;

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-right-4 duration-500 pb-32">
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="p-3 bg-gray-100 rounded-2xl text-gray-600 active:scale-90 transition-transform">
          <ArrowLeft size={24} />
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Formulário de Registro</span>
      </div>

      <div className="space-y-2">
        <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">
          {type === 'perdi' ? 'Relatar Perda' : 'Relatar Achado'}
        </h2>
        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Preencha os dados com honestidade</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Nome Completo</label>
          <input 
            placeholder="EX: MÁRIO JOSÉ DOS SANTOS" 
            className="w-full p-5 bg-white border-2 border-gray-100 focus:border-moz-black rounded-[32px] font-black uppercase text-xs tracking-widest outline-none transition-all" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Tipo de Documento</label>
          <select 
            className="w-full p-5 bg-white border-2 border-gray-100 focus:border-moz-black rounded-[32px] font-black uppercase text-xs tracking-widest outline-none transition-all appearance-none"
            value={formData.type}
            onChange={e => setFormData({...formData, type: e.target.value as any})}
          >
            {Object.values(DocType).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Número do Documento</label>
          <input 
            placeholder="NÚMERO OU SÉRIE..." 
            className="w-full p-5 bg-white border-2 border-gray-100 focus:border-moz-black rounded-[32px] font-black uppercase text-xs tracking-widest outline-none transition-all" 
            value={formData.number} 
            onChange={e => setFormData({...formData, number: e.target.value})} 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Província</label>
            <select 
              className="w-full p-5 bg-white border-2 border-gray-100 focus:border-moz-black rounded-[32px] font-black uppercase text-xs tracking-widest outline-none transition-all appearance-none"
              value={formData.province}
              onChange={e => setFormData({...formData, province: e.target.value as any})}
            >
              {Object.values(Province).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Telemóvel</label>
            <input 
              placeholder="8X XXX XXXX" 
              className="w-full p-5 bg-white border-2 border-gray-100 focus:border-moz-black rounded-[32px] font-black uppercase text-xs tracking-widest outline-none transition-all" 
              value={formData.contact} 
              onChange={e => setFormData({...formData, contact: e.target.value})} 
            />
          </div>
        </div>

        <button 
          disabled={!isValid} 
          onClick={() => onSubmit({...formData, status: type})} 
          className={`w-full py-6 rounded-[40px] font-black text-lg shadow-2xl uppercase tracking-widest transition-all active:scale-95 ${isValid ? (type === 'perdi' ? 'bg-moz-red text-white' : 'bg-moz-green text-white') : 'bg-gray-200 text-gray-400'}`}
        >
          {type === 'perdi' ? 'Publicar Perda' : 'Publicar Achado'}
        </button>
      </div>
    </div>
  );
}

function SuccessModal({ type, data, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-moz-black/90 z-[100] flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white rounded-[64px] p-10 w-full max-w-sm text-center space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-moz-green via-moz-yellow to-moz-red" />
        
        <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center text-white mx-auto animate-bounce shadow-xl ${type === 'already_found' ? 'bg-moz-yellow' : 'bg-moz-green'}`}>
          {type === 'already_found' ? <Zap size={48} /> : <CheckCircle2 size={48} />}
        </div>

        <div className="space-y-2">
          <h3 className="text-3xl font-black uppercase tracking-tighter">
            {type === 'already_found' ? 'MATCH ENCONTRADO!' : 'REGISTRADO!'}
          </h3>
          <p className="text-gray-500 font-bold text-xs uppercase leading-relaxed px-4">
            {type === 'already_found' 
              ? `BOAS NOTÍCIAS! O DOCUMENTO DE ${data.name} FOI LOCALIZADO POR ALGUÉM NA NOSSA REDE.` 
              : "SEU REGISTRO ESTÁ ATIVO. ESTAMOS MONITORANDO PARA TE AJUDAR O MAIS RÁPIDO POSSÍVEL."}
          </p>
        </div>

        <button 
          onClick={onClose} 
          className="w-full bg-moz-black text-white py-6 rounded-[32px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
        >
          {type === 'already_found' ? 'Ver Contactos' : 'Ir para o Mural'}
        </button>
      </div>
    </div>
  );
}

function InfoView({ onClose }: any) {
  const steps = [
    { icon: <Shield />, title: "Segurança", text: "Nunca pague nada antes de ver o documento em mãos. Encontre-se em locais públicos." },
    { icon: <CheckCircle2 />, title: "Honestidade", text: "A plataforma baseia-se na boa fé dos moçambicanos. Seja honesto e devolva o que não é seu." },
    { icon: <AlertTriangle />, title: "Perdi e agora?", text: "Se não encontrar aqui, dirija-se à esquadra mais próxima e peça uma guia de substituição." }
  ];

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-bottom-4">
      <button onClick={onClose} className="p-3 bg-gray-100 rounded-2xl text-gray-600">
        <ArrowLeft size={24} />
      </button>

      <div className="space-y-2">
        <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Guia & Ajuda</h2>
        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Informações importantes para você</p>
      </div>

      <div className="space-y-4">
        {steps.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-3">
             <div className="w-10 h-10 bg-moz-yellow/10 text-moz-yellow rounded-xl flex items-center justify-center">
                {s.icon}
             </div>
             <h4 className="font-black uppercase text-sm tracking-tight">{s.title}</h4>
             <p className="text-xs text-gray-500 font-bold leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="bg-moz-black p-8 rounded-[40px] text-white space-y-4">
        <h4 className="font-black uppercase tracking-tighter text-xl">Dica Inteligente</h4>
        <p className="text-xs text-white/70 font-bold leading-relaxed">
          Tire sempre fotos dos seus documentos e guarde na nuvem. Isso facilita muito o processo de recuperação ou emissão de segunda via.
        </p>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);