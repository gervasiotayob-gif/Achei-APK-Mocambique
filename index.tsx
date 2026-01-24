
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Home, ClipboardList, LifeBuoy, User, PlusCircle, Search, 
  ArrowLeft, Camera, Send, CheckCircle2, Phone, MessageCircle, 
  AlertTriangle, Star, Shield, Mail, X, Trophy, Bell, BellOff, 
  ListChecks, LogOut, ThumbsUp, Heart as HeartIcon, Zap, UserCheck 
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- Tipos e Enums ---

enum DocType {
  BI = 'Bilhete de Identidade',
  DIRE = 'DIRE',
  PASSPORT = 'Passaporte',
  LICENSE = 'Carta de Condução',
  NUIT = 'NUIT',
  OUTRO = 'Outro'
}

enum Province {
  MAPUTO_CIDADE = 'Maputo Cidade',
  MAPUTO_PROVINCIA = 'Maputo Província',
  GAZA = 'Gaza',
  INHAMBANE = 'Inhambane',
  SOFALA = 'Sofala',
  MANICA = 'Manica',
  TETE = 'Tete',
  ZAMBEZIA = 'Zambézia',
  NAMPULA = 'Nampula',
  NIASSA = 'Niassa',
  CABO_DELGADO = 'Cabo Delgado'
}

interface DocumentEntry {
  id: string;
  name: string;
  type: DocType;
  number: string;
  province: Province;
  location: string;
  contact: string;
  status: 'perdi' | 'encontrei';
  createdAt: number;
}

interface Testimonial {
  id: string;
  author: string;
  text: string;
  rating: number;
  likes: number;
}

type View = 'home' | 'mural' | 'apoio' | 'perfil' | 'form_perdi' | 'form_encontrei';

// --- Constantes ---

const MOZ_PHRASES = [
  "A solidariedade une Moçambique.",
  "Recuperando o que é seu.",
  "Honestidade em primeiro lugar.",
  "Viva Moçambique!",
  "Ajudando uns aos outros, sempre."
];

const SECURITY_STEPS_LOST = [
  "Nunca vá sozinho encontrar o achador.",
  "Escolha um local público e movimentado (Ex: Esquadra, Shoprite).",
  "Verifique o documento antes de entregar qualquer valor.",
  "Não forneça dados bancários por telefone."
];

const SECURITY_STEPS_FOUND = [
  "Marque o encontro em local seguro.",
  "Peça ao dono para confirmar dados que não estão visíveis.",
  "Seja cortês e aceite a recompensa com gratidão.",
  "Não retenha o documento caso o dono não tenha o valor total."
];

const INITIAL_TESTIMONIALS: Testimonial[] = [
  { id: '1', author: 'Gervásio', text: 'Recuperei meu BI em menos de 24 horas! Incrível.', rating: 5, likes: 12 },
  { id: '2', author: 'Fátima', text: 'Plataforma muito segura e fácil de usar. Recomendo.', rating: 5, likes: 8 },
  { id: '3', author: 'António', text: 'Encontrei um NUIT e devolvi ao dono rapidinho.', rating: 5, likes: 15 },
];

const REWARD_AMOUNT = "500,00 MT";
const FLAG_URL = "https://flagcdn.com/w640/mz.png";

const SUPPORT_VALUES = [
  { icon: <HeartIcon className="w-5 h-5" />, label: "Solidariedade" },
  { icon: <Zap className="w-5 h-5" />, label: "Rapidez" },
  { icon: <Shield className="w-5 h-5" />, label: "Segurança" },
  { icon: <Star className="w-5 h-5" />, label: "Valores" },
  { icon: <UserCheck className="w-5 h-5" />, label: "Honestidade" }
];

// --- Serviço Gemini ---

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function extractDocumentInfo(base64Image: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { text: "Extract Name, Document Type, and Number from this Mozambican document. Return JSON." },
            { inlineData: { mimeType: "image/jpeg", data: base64Image } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING },
            number: { type: Type.STRING },
          },
          required: ["name", "type", "number"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Erro na leitura do documento:", error);
    return null;
  }
}

// --- Componentes ---

const Logo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizes = { sm: "w-8 h-8", md: "w-16 h-16", lg: "w-24 h-24" };
  return (
    <div className={`${sizes[size]} relative flex items-center justify-center`}>
      <div className="absolute inset-0 bg-moz-red rounded-full transform -rotate-12 border-2 border-white shadow-sm"></div>
      <div className="absolute inset-0 bg-moz-green rounded-full transform rotate-12 opacity-80 border-2 border-white"></div>
      <div className="relative z-10 flex flex-col items-center">
        <span className="text-white font-black text-[10px] md:text-xs leading-none drop-shadow-md">ACHEI</span>
        <span className="text-moz-yellow font-black text-xs md:text-sm leading-none drop-shadow-md">MOZ</span>
      </div>
    </div>
  );
};

function App() {
  const [loading, setLoading] = useState(true);
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [activeView, setActiveView] = useState<View>('home');
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(INITIAL_TESTIMONIALS);
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{ show: boolean; data?: any; type?: 'lost' | 'found' | 'already_found' }>({ show: false });

  useEffect(() => {
    if (loading) {
      const phraseInterval = setInterval(() => {
        setCurrentPhrase((prev) => (prev + 1) % MOZ_PHRASES.length);
      }, 2500);
      const timer = setTimeout(() => {
        setLoading(false);
        clearInterval(phraseInterval);
      }, 7000);
      return () => { clearTimeout(timer); clearInterval(phraseInterval); };
    }
  }, [loading]);

  const handleAddDocument = (entry: Omit<DocumentEntry, 'id' | 'createdAt'>) => {
    if (entry.status === 'perdi') {
      const existing = documents.find(d => d.number === entry.number && d.status === 'encontrei');
      if (existing) {
        setSuccessModal({ show: true, type: 'already_found', data: { ...entry, finder: existing } });
        return;
      }
    }
    const newDoc: DocumentEntry = { ...entry, id: Math.random().toString(36).substr(2, 9), createdAt: Date.now() };
    setDocuments([newDoc, ...documents]);
    setSuccessModal({ show: true, type: entry.status, data: newDoc });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 mesh-bg flex flex-col items-center justify-center p-8 overflow-hidden z-[100]">
        <img src={FLAG_URL} alt="Moz Flag" className="absolute w-[150%] opacity-10 blur-[1px] animate-float-flag" />
        <div className="relative z-10 flex flex-col items-center space-y-12 text-center w-full max-w-xs">
          <Logo size="lg" />
          <div className="h-20 flex items-center justify-center">
            <p className="text-2xl font-black text-white drop-shadow-2xl animate-soft-pulse uppercase">{MOZ_PHRASES[currentPhrase]}</p>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden backdrop-blur-md border border-white/10">
            <div className="bg-gradient-to-r from-moz-yellow to-white h-full transition-all duration-[7000ms] ease-linear w-full shadow-[0_0_15px_#FFD200]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto shadow-xl relative overflow-hidden text-gray-900">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center space-x-3">
          <Logo size="sm" />
          <div className="flex items-center space-x-2">
            <h1 className="font-black text-xl tracking-tight text-moz-black">ACHEI <span className="text-moz-red">MOZ</span></h1>
            <img src={FLAG_URL} alt="Moz Flag" className="w-6 h-4 rounded shadow-sm border border-gray-100" />
          </div>
        </div>
        <div className="flex -space-x-1">
          <div className="w-3 h-3 bg-moz-green rounded-full border border-white z-30"></div>
          <div className="w-3 h-3 bg-moz-red rounded-full border border-white z-20"></div>
          <div className="w-3 h-3 bg-moz-black rounded-full border border-white z-10"></div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 hide-scrollbar">
        {activeView === 'home' && <HomeView setActiveView={setActiveView} testimonials={testimonials} setTestimonials={setTestimonials} />}
        {activeView === 'mural' && <MuralView documents={documents} />}
        {activeView === 'apoio' && <SupportView />}
        {activeView === 'perfil' && <ProfileView userDocsCount={documents.length} profileImage={userProfileImage} onImageUpdate={setUserProfileImage} onLogout={() => setLoading(true)} />}
        {(activeView === 'form_perdi' || activeView === 'form_encontrei') && <DocumentForm type={activeView === 'form_perdi' ? 'perdi' : 'encontrei'} onClose={() => setActiveView('home')} onSubmit={handleAddDocument} />}
      </main>

      <nav className="bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <NavButton active={activeView === 'home'} icon={<Home size={22} />} label="Início" onClick={() => setActiveView('home')} />
        <NavButton active={activeView === 'mural'} icon={<ClipboardList size={22} />} label="Mural" onClick={() => setActiveView('mural')} />
        <NavButton active={activeView === 'apoio'} icon={<LifeBuoy size={22} />} label="Apoio" onClick={() => setActiveView('apoio')} />
        <NavButton active={activeView === 'perfil'} icon={<User size={22} />} label="Perfil" onClick={() => setActiveView('perfil')} />
      </nav>

      {successModal.show && <SuccessModal type={successModal.type!} data={successModal.data} onClose={() => { setSuccessModal({ show: false }); setActiveView('mural'); }} />}
    </div>
  );
}

// --- Sub-Visões ---

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center space-y-1 transition-all ${active ? 'text-moz-red scale-110' : 'text-gray-400'}`}>
      {icon} <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function HomeView({ setActiveView, testimonials, setTestimonials }: { setActiveView: (v: View) => void; testimonials: Testimonial[]; setTestimonials: React.Dispatch<React.SetStateAction<Testimonial[]>> }) {
  const [newTestimonial, setNewTestimonial] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); if (userLikes.has(id)) return;
    setUserLikes(prev => new Set(prev).add(id));
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, likes: t.likes + 1 } : t));
  };

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="relative h-56 rounded-[40px] overflow-hidden shadow-2xl group flex items-end">
        <div className="absolute inset-0 bg-gradient-to-tr from-moz-black via-moz-green to-moz-red animate-pulse duration-[10s] opacity-90" />
        <div className="absolute inset-0 bg-black/20 backdrop-brightness-75" />
        <div className="relative z-10 w-full p-8">
           <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[32px] shadow-2xl">
              <p className="text-[10px] font-black text-moz-yellow uppercase tracking-[0.4em] mb-2">Boas-vindas</p>
              <h2 className="text-3xl font-black text-white leading-none uppercase tracking-tighter mb-2">ACHEI <span className="text-moz-yellow">MOZ</span></h2>
              <div className="h-0.5 w-12 bg-moz-yellow mb-3 rounded-full" />
              <p className="text-white/90 font-bold text-xs uppercase tracking-widest leading-relaxed">Sua ponte solidária <br/> em Moçambique.</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button onClick={() => setActiveView('form_perdi')} className="bg-moz-red text-white p-6 rounded-[32px] flex items-center justify-between group active:scale-95 transition-all shadow-lg border-b-4 border-black/20">
          <div className="text-left"><span className="block text-xl font-black uppercase tracking-tight">Perdi documentos</span><span className="text-white/80 text-xs font-bold uppercase tracking-widest">Registrar perda</span></div>
          <div className="bg-white/20 p-3 rounded-2xl"><Search className="w-6 h-6" /></div>
        </button>
        <button onClick={() => setActiveView('form_encontrei')} className="bg-moz-green text-white p-6 rounded-[32px] flex items-center justify-between group active:scale-95 transition-all shadow-lg border-b-4 border-black/20">
          <div className="text-left"><span className="block text-xl font-black uppercase tracking-tight">Encontrei documentos</span><span className="text-white/80 text-xs font-bold uppercase tracking-widest">Devolver a alguém</span></div>
          <div className="bg-white/20 p-3 rounded-2xl"><PlusCircle className="w-6 h-6" /></div>
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2"><h3 className="font-black text-gray-900 uppercase">Depoimentos</h3><span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase shadow-sm ${isPaused ? 'bg-moz-red text-white' : 'bg-moz-green text-white'}`}>{isPaused ? 'Pausado' : 'Rodando'}</span></div>
          <button onClick={() => setNewTestimonial(true)} className="text-xs font-black text-moz-red uppercase bg-moz-red/10 px-4 py-2 rounded-full">Escrever</button>
        </div>
        <div className="relative overflow-hidden h-44 bg-gray-100 rounded-[32px] border border-gray-200 flex items-center cursor-pointer shadow-inner" onClick={() => setIsPaused(!isPaused)}>
          <div className="animate-marquee flex" style={{ animationPlayState: isPaused ? 'paused' : 'running' }}>
            {[...testimonials, ...testimonials].map((t, idx) => (
              <div key={`${t.id}-${idx}`} className="mx-3 inline-block bg-white p-5 rounded-2xl shadow-sm border border-gray-100 min-w-[260px] max-w-[260px] h-36 flex flex-col justify-between whitespace-normal active:scale-[0.98]">
                <div><div className="flex text-moz-yellow mb-2">{[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" strokeWidth={0} />)}</div><p className="text-sm font-bold italic text-gray-800 leading-tight">"{t.text}"</p></div>
                <div className="flex items-center justify-between mt-2"><span className="text-xs font-black text-moz-green uppercase tracking-widest">{t.author}</span><button onClick={(e) => handleLike(t.id, e)} className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-all ${userLikes.has(t.id) ? 'bg-moz-red text-white' : 'bg-gray-50 text-gray-500'}`}><HeartIcon size={12} fill={userLikes.has(t.id) ? "currentColor" : "none"} /><span className="text-[10px] font-black">{t.likes}</span></button></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {newTestimonial && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm space-y-6 shadow-2xl border-t-8 border-moz-red">
            <h3 className="text-2xl font-black text-moz-black uppercase">Novo Depoimento</h3>
            <div className="space-y-4">
              <input placeholder="Seu nome" className="w-full p-5 bg-gray-50 rounded-2xl outline-none border border-gray-100 text-xs font-black uppercase" id="author" />
              <textarea placeholder="Sua experiência..." className="w-full p-5 bg-gray-50 rounded-2xl outline-none border border-gray-100 h-32 font-bold" id="text" />
            </div>
            <div className="flex justify-end space-x-3"><button onClick={() => setNewTestimonial(false)} className="px-6 py-4 font-black text-gray-500 text-xs uppercase">Cancelar</button><button onClick={() => { const author = (document.getElementById('author') as HTMLInputElement).value; const text = (document.getElementById('text') as HTMLTextAreaElement).value; if (author && text) { setTestimonials([{ id: Date.now().toString(), author, text, rating: 5, likes: 0 }, ...testimonials]); setNewTestimonial(false); } }} className="bg-moz-red text-white px-8 py-4 rounded-2xl font-black uppercase text-xs">Publicar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentForm({ type, onClose, onSubmit }: { type: 'perdi' | 'encontrei'; onClose: () => void; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({ name: '', type: DocType.BI, number: '', province: Province.MAPUTO_CIDADE, location: '', contact: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const isValid = Object.values(formData).every(val => (val as string).length > 0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const extracted = await extractDocumentInfo(base64);
        if (extracted) {
          setFormData(prev => ({
            ...prev,
            name: extracted.name || '',
            number: extracted.number || '',
            type: (Object.values(DocType).find(t => t.toLowerCase().includes(extracted.type?.toLowerCase())) as DocType) || DocType.BI
          }));
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right-4 duration-300">
      <button onClick={onClose} className="flex items-center space-x-2 text-gray-600 font-black active:text-moz-red"><ArrowLeft size={20} /> <span className="uppercase text-xs tracking-widest">Voltar</span></button>
      <div><h2 className="text-3xl font-black text-gray-900 uppercase leading-none">{type === 'perdi' ? 'Relatar Perda' : 'Relatar Achado'}</h2><p className="text-xs text-gray-500 font-bold uppercase mt-2">Dados do documento moçambicano</p></div>
      {type === 'encontrei' && (
        <div className="bg-moz-yellow p-6 rounded-[32px] border-2 border-moz-black flex items-center justify-between shadow-lg relative group">
          <div className="relative z-10"><p className="text-sm font-black text-moz-black uppercase">Registro Inteligente</p><p className="text-[10px] text-moz-black/70 font-black uppercase">Tire uma foto para preencher.</p></div>
          <label className="bg-moz-black text-white p-4 rounded-2xl cursor-pointer active:scale-95 transition-all shadow-xl relative z-10"><Camera size={24} /><input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isProcessing} /></label>
        </div>
      )}
      {isProcessing && <div className="text-center py-4 text-moz-green font-black animate-pulse uppercase text-xs tracking-[0.3em]">IA Analisando...</div>}
      <div className="space-y-4">
        <InputField label="Nome completo" value={formData.name} onChange={(v) => setFormData({...formData, name: v})} />
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Tipo" value={formData.type} options={Object.values(DocType)} onChange={(v) => setFormData({...formData, type: v as DocType})} />
          <InputField label="Número" value={formData.number} onChange={(v) => setFormData({...formData, number: v})} />
        </div>
        <SelectField label="Província" value={formData.province} options={Object.values(Province)} onChange={(v) => setFormData({...formData, province: v as Province})} />
        <InputField label={type === 'perdi' ? "Onde perdeu?" : "Onde encontrou?"} value={formData.location} onChange={(v) => setFormData({...formData, location: v})} />
        <InputField label="Telemóvel para contacto" value={formData.contact} onChange={(v) => setFormData({...formData, contact: v})} />
      </div>
      <button disabled={!isValid} onClick={() => onSubmit({...formData, status: type})} className={`w-full py-6 rounded-[32px] font-black text-lg shadow-xl flex items-center justify-center space-x-3 transition-all active:scale-95 uppercase tracking-widest ${isValid ? (type === 'perdi' ? 'bg-moz-red text-white' : 'bg-moz-green text-white') : 'bg-gray-200 text-gray-400'}`}><span>Finalizar Registro</span> <Send size={20} /></button>
    </div>
  );
}

function InputField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-5 bg-white border border-gray-100 rounded-2xl outline-none focus:border-moz-red shadow-sm text-gray-900 font-bold" />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-5 bg-white border border-gray-100 rounded-2xl outline-none focus:border-moz-red shadow-sm text-gray-900 font-bold appearance-none">
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function MuralView({ documents }: { documents: DocumentEntry[] }) {
  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between"><h2 className="text-3xl font-black text-gray-900 uppercase">Mural</h2><span className="text-[10px] font-black text-moz-green bg-moz-green/10 px-4 py-1.5 rounded-full uppercase">Pendente</span></div>
      {documents.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-200 shadow-sm flex flex-col items-center">
          <div className="p-6 bg-gray-50 rounded-full mb-4"><ClipboardList className="w-12 h-12 text-gray-300" /></div>
          <p className="text-gray-400 font-black uppercase text-xs">Sem registros no momento</p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-start space-x-5 active:scale-[0.98]">
              <div className={`p-4 rounded-2xl ${doc.status === 'perdi' ? 'bg-moz-red/10 text-moz-red' : 'bg-moz-green/10 text-moz-green'}`}>{doc.status === 'perdi' ? <Search size={28} /> : <CheckCircle2 size={28} />}</div>
              <div className="flex-1">
                <p className="font-black text-gray-900 uppercase text-lg leading-tight">{doc.name}</p>
                <div className="flex items-center space-x-2 text-[10px] font-black text-gray-400 uppercase mt-1"><span>{doc.type}</span> <span className="text-moz-red">•</span> <span>{doc.province}</span></div>
                <div className="flex items-center justify-between mt-4"><p className="text-[9px] text-gray-400 font-black uppercase">{new Date(doc.createdAt).toLocaleDateString('pt-MZ')}</p><span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${doc.status === 'perdi' ? 'bg-moz-red text-white' : 'bg-moz-green text-white'}`}>{doc.status}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SupportView() {
  const [selectedValue, setSelectedValue] = useState<{label: string, message: string} | null>(null);
  const valueMessages: Record<string, string> = {
    "Solidariedade": "Em Moçambique, quando um cai, todos ajudamos a levantar. Sua solidariedade salva vidas e devolve sorrisos.",
    "Rapidez": "O tempo é precioso. Unimos quem perdeu com quem achou no menor tempo possível.",
    "Segurança": "Protegemos sua integridade. Siga sempre nossos passos de segurança em encontros presenciais.",
    "Valores": "Respeito e ética acima de tudo. Fazer o certo é a única opção.",
    "Honestidade": "Devolver o que não é seu é um ato de patriotismo. Viva Moçambique!"
  };

  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-bottom-4">
      <div className="relative bg-moz-black text-white p-8 rounded-[40px] space-y-6 shadow-2xl border-b-8 border-moz-red">
        <h2 className="text-3xl font-black text-moz-yellow uppercase">Apoie a Causa</h2>
        <p className="text-gray-100 font-bold text-sm">Sua ajuda mantém o ACHEI MOZ online e solidário para todos.</p>
        <div className="space-y-3 pt-2">
          <a href="https://wa.me/258833125872" className="w-full bg-[#25D366] text-white p-5 rounded-2xl flex items-center justify-between shadow-xl"><div className="flex items-center space-x-4"><MessageCircle className="w-7 h-7" /><p className="text-lg font-black">WhatsApp</p></div><Send className="w-5 h-5 opacity-40" /></a>
          <a href="mailto:motrixcore@gmail.com" className="w-full bg-moz-red text-white p-5 rounded-2xl flex items-center justify-between shadow-xl"><div className="flex items-center space-x-4"><Mail className="w-7 h-7" /><p className="text-base font-black">E-mail</p></div><Send className="w-5 h-5 opacity-40" /></a>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="font-black text-gray-900 uppercase">Sugestões</h3>
        <div className="relative"><textarea placeholder="Diga-nos como melhorar..." className="w-full p-6 bg-white border border-gray-100 rounded-[32px] outline-none shadow-inner h-32 font-bold" /><button className="absolute bottom-4 right-4 bg-moz-black text-white p-3 rounded-2xl"><Send size={18} /></button></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {SUPPORT_VALUES.map((val, idx) => (
          <button key={idx} onClick={() => setSelectedValue({ label: val.label, message: valueMessages[val.label] })} className="bg-white p-5 rounded-[24px] border border-gray-100 flex items-center space-x-4 active:scale-95 transition-all text-left">
            <div className="p-2 bg-moz-red/5 text-moz-red rounded-xl">{val.icon}</div><span className="text-[10px] font-black uppercase">{val.label}</span>
          </button>
        ))}
      </div>
      {selectedValue && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-sm text-center space-y-8 shadow-2xl border-t-8 border-moz-red"><button onClick={() => setSelectedValue(null)} className="absolute top-6 right-6 text-gray-400"><X size={28} /></button><h3 className="text-3xl font-black text-moz-black uppercase">{selectedValue.label}</h3><p className="text-gray-800 font-bold">{selectedValue.message}</p><button onClick={() => setSelectedValue(null)} className="w-full bg-moz-black text-white py-5 rounded-2xl font-black uppercase">Fechar</button></div>
        </div>
      )}
    </div>
  );
}

function ProfileView({ userDocsCount, profileImage, onImageUpdate, onLogout }: { userDocsCount: number; profileImage: string | null; onImageUpdate: (img: string) => void; onLogout: () => void }) {
  const [modalInfo, setModalInfo] = useState<{ title: string; content: string; icon: React.ReactNode } | null>(null);
  return (
    <div className="p-6 space-y-8 animate-in slide-in-from-bottom-4">
      <div className="flex flex-col items-center space-y-6">
        <label className="relative cursor-pointer group">
          <div className="w-32 h-32 bg-moz-green rounded-full flex items-center justify-center text-white text-5xl font-black shadow-2xl border-4 border-white overflow-hidden relative">{profileImage ? <img src={profileImage} className="w-full h-full object-cover" /> : "U"}</div>
          <input type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const r = new FileReader(); r.onload = () => onImageUpdate(r.result as string); r.readAsDataURL(file); } }} />
        </label>
        <div className="text-center"><h2 className="text-3xl font-black text-gray-900 uppercase">Usuário Solidário</h2><p className="text-[10px] text-moz-green font-black uppercase tracking-[0.3em] mt-2">Patriota Moz • Bronze</p></div>
      </div>
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
        <ProfileItem label="Meus Registros" value={userDocsCount.toString()} onClick={() => setModalInfo({ title: "Meus Registros", content: `Você já ajudou registrando ${userDocsCount} documentos.`, icon: <ListChecks size={32} /> })} />
        <ProfileItem label="Conquistas" value="0" onClick={() => setModalInfo({ title: "Medalhas", content: "Complete devoluções para ganhar medalhas de solidariedade!", icon: <Trophy size={32} /> })} />
      </div>
      <button onClick={onLogout} className="w-full py-6 rounded-[32px] font-black text-moz-red bg-moz-red/5 uppercase text-xs">Sair do Achei Moz</button>
      {modalInfo && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-6 backdrop-blur-md animate-in zoom-in-95"><div className="bg-white rounded-[40px] p-10 w-full max-w-sm text-center space-y-8 shadow-2xl relative border-t-8 border-moz-green"><button onClick={() => setModalInfo(null)} className="absolute top-6 right-6 text-gray-400"><X size={28} /></button><h3 className="text-2xl font-black uppercase">{modalInfo.title}</h3><p className="text-gray-800 font-bold">{modalInfo.content}</p><button onClick={() => setModalInfo(null)} className="w-full bg-moz-black text-white py-5 rounded-2xl font-black uppercase">Fechar</button></div></div>
      )}
    </div>
  );
}

function ProfileItem({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full p-6 flex justify-between items-center bg-white hover:bg-gray-50 text-left">
      <span className="font-black text-gray-600 uppercase text-xs">{label}</span><span className="font-black text-moz-green uppercase text-xs">{value}</span>
    </button>
  );
}

function SuccessModal({ type, data, onClose }: { type: 'lost' | 'found' | 'already_found'; data: any; onClose: () => void }) {
  const [showSecurity, setShowSecurity] = useState(false);
  const firstName = data.name.split(' ')[0].toUpperCase();

  if (showSecurity) {
    const steps = type === 'found' ? SECURITY_STEPS_FOUND : SECURITY_STEPS_LOST;
    return (
      <div className="fixed inset-0 bg-white z-[60] flex flex-col p-8 overflow-y-auto animate-in slide-in-from-bottom-10">
        <div className="flex-1 space-y-10"><div className="bg-moz-red/10 p-8 rounded-[40px] inline-block shadow-sm"><Shield size={64} className="text-moz-red" /></div><h3 className="text-3xl font-black uppercase">Segurança Primeiro</h3><div className="space-y-4">{steps.map((step, i) => (<div key={i} className="flex items-start space-x-5 bg-gray-50 p-6 rounded-[32px] border border-gray-100 shadow-sm"><div className="w-8 h-8 bg-moz-red text-white text-sm font-black rounded-full flex items-center justify-center shrink-0">{i + 1}</div><p className="text-sm font-black text-gray-800 leading-tight uppercase tracking-tight">{step}</p></div>))}</div></div>
        <button onClick={onClose} className="w-full bg-moz-black text-white py-6 rounded-[32px] font-black uppercase shadow-2xl mt-8">Entendido, Viva Moz!</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-[48px] p-10 w-full max-w-sm text-center space-y-8 shadow-2xl relative overflow-hidden border-t-8 border-moz-green">
        <div className="flex justify-center"><div className="w-24 h-24 bg-moz-green rounded-full flex items-center justify-center text-white animate-bounce shadow-xl border-4 border-white"><CheckCircle2 size={48} /></div></div>
        
        {type === 'already_found' ? (
          <div className="space-y-6">
            <h3 className="text-3xl font-black text-moz-green uppercase">Epa! Encontrado!</h3>
            <p className="text-gray-900 text-sm font-bold leading-relaxed">
              Olá <span className="text-moz-red">{firstName}</span>! Obrigado! O seu documento {data.type} ({data.number}) foi encontrado através do ACHEI MOZ por um cidadão solidário em {data.finder.location}, {data.finder.province}. Por favor, entre em contacto para recuperar.
            </p>
            <div className="bg-moz-yellow p-8 rounded-[40px] shadow-xl border-4 border-moz-black">
              <p className="text-[10px] font-black text-moz-black uppercase mb-2">Recompensa Solidária</p>
              <p className="text-4xl font-black text-moz-red">{REWARD_AMOUNT}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <a href={`tel:${data.finder.contact}`} className="bg-moz-green text-white p-5 rounded-2xl flex items-center justify-center space-x-3 shadow-xl"><Phone size={24} /> <span className="font-black uppercase text-xs">Ligar</span></a>
              <a href={`https://wa.me/${data.finder.contact}`} className="bg-[#25D366] text-white p-5 rounded-2xl flex items-center justify-center space-x-3 shadow-xl"><MessageCircle size={24} /> <span className="font-black uppercase text-xs">Chat</span></a>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-3xl font-black text-moz-black uppercase">Registrado!</h3>
            <p className="text-gray-800 text-sm font-bold leading-relaxed">{type === 'lost' ? "Seu registro está ativo. Você será alertado assim que o documento for encontrado por alguém. Moçambique unido!" : "Obrigado por ajudar! O dono será alertado e entrará em contacto em breve."}</p>
            <div className="bg-moz-yellow p-8 rounded-[40px] shadow-xl border-4 border-moz-black">
              <p className="text-[10px] font-black text-moz-black uppercase mb-2">Valor de Agradecimento</p>
              <p className="text-4xl font-black text-moz-red">{REWARD_AMOUNT}</p>
              <p className="text-[9px] font-black text-moz-black mt-2 uppercase">{type === 'found' ? "A receber no momento da entrega." : "A pagar ao achador como gratidão."}</p>
            </div>
          </div>
        )}
        <button onClick={() => setShowSecurity(true)} className="w-full bg-moz-red text-white py-5 rounded-[32px] font-black uppercase shadow-2xl">Continuar</button>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
