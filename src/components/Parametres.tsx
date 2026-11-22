import { useState } from 'react';
import { Save, Trash2, RefreshCw, Building2, Phone, Mail, Globe, MapPin, Download, Lock, Upload, Image } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiCall } from '../api/client';
import toast from 'react-hot-toast';
import { validateEmail, validatePhone, validateRequired } from '../utils/validation';


export default function Parametres() {
  const { data, updateOng } = useApp();
  const [form, setForm] = useState({ primaryColor: '#0d9488', logo: '', ...data.ong });
  const [resetConfirm, setResetConfirm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateRequired(form.nom)) {
      toast.error('Le nom de l\'ONG est obligatoire');
      return;
    }

    if (form.email && !validateEmail(form.email)) {
      toast.error('L\'adresse email est invalide');
      return;
    }

    if (form.telephone && !validatePhone(form.telephone)) {
      toast.error('Le numéro de téléphone est invalide');
      return;
    }

    try {
      await updateOng(form);
      toast.success('Paramètres sauvegardés avec succès !');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    }
  }

  async function handleBackup() {
    try {
      window.location.href = '/api/backup.php';
      toast.success('Téléchargement de la sauvegarde lancé...');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du lancement de la sauvegarde');
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      await apiCall('auth.php', { action: 'change-password' }, { current_password: passwordForm.current_password, new_password: passwordForm.new_password });
      toast.success('Mot de passe modifié avec succès');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe');
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 2 Mo');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm({ ...form, logo: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  function handleReset() {

    localStorage.clear();
    window.location.reload();
  }

  const stats = [
    { label: 'Membres', value: data.membres.length },
    { label: 'Projets', value: data.projets.length },
    { label: 'Dons', value: data.dons.length },
    { label: 'Transactions', value: data.transactions.length },
    { label: 'Événements', value: data.evenements.length },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Paramètres de l'ONG</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Configurez les informations générales de votre organisation</p>
      </div>

      {/* Infos ONG */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-gray-600 flex items-center gap-3" style={{ backgroundColor: '#f0fdf4', borderColor: `${form.primaryColor || '#0d9488'}33` }}>
          <Building2 className="w-5 h-5" style={{ color: form.primaryColor || '#0d9488' }} />
          <h3 className="font-semibold" style={{ color: form.primaryColor || '#0d9488' }}>Informations de l'organisation</h3>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Nom de l'ONG *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 dark:bg-gray-700 dark:text-gray-200" placeholder="Nom de l'ONG" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Slogan / Mission</label>
              <textarea value={form.slogan} onChange={e => setForm({ ...form, slogan: e.target.value })} rows={2} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 dark:bg-gray-700 dark:text-gray-200" placeholder="Mission ou slogan de l'ONG" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 dark:bg-gray-700 dark:text-gray-200" placeholder="contact@ong.org" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 dark:bg-gray-700 dark:text-gray-200" placeholder="+225 07 00 00 00" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Adresse</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 dark:bg-gray-700 dark:text-gray-200" placeholder="Ville, Pays" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Site Web</label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input value={form.siteWeb} onChange={e => setForm({ ...form, siteWeb: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 dark:bg-gray-700 dark:text-gray-200" placeholder="www.ong.org" />
              </div>
            </div>
             <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Couleur principale</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={form.primaryColor || '#0d9488'} 
                    onChange={e => setForm({ ...form, primaryColor: e.target.value })} 
                    className="w-10 h-10 p-1 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer dark:bg-gray-700" 
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{form.primaryColor || '#0d9488'}</span>
                </div>
             </div>
             <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Devise</label>
               <select value={form.devise} onChange={e => setForm({ ...form, devise: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 dark:bg-gray-700 dark:text-gray-200">
                <option value="FCFA">FCFA (Franc CFA)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="USD">USD (Dollar)</option>
                <option value="GNF">GNF (Franc Guinéen)</option>
                <option value="XOF">XOF (Franc Ouest Africain)</option>
              </select>
            </div>
          </div>

           <div className="flex items-center gap-3 pt-2">
              <button type="submit" className="flex items-center gap-2 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors btn-primary">
               <Save className="w-4 h-4" /> Enregistrer les modifications
             </button>
           </div>
        </form>
      </div>

      {/* Logo */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-gray-600 flex items-center gap-3" style={{ backgroundColor: '#f0fdf4', borderColor: `${form.primaryColor || '#0d9488'}33` }}>
          <Image className="w-5 h-5" style={{ color: form.primaryColor || '#0d9488' }} />
          <h3 className="font-semibold" style={{ color: form.primaryColor || '#0d9488' }}>Logo de l'organisation</h3>
        </div>
        <div className="p-6 flex items-center gap-6">
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700 flex-shrink-0">
            {form.logo ? (
              <img src={form.logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo de l'ONG</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Format recommandé : PNG ou JPG, max 2 Mo</p>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 dark:file:bg-green-900/30 dark:file:text-green-300 hover:file:bg-green-100 dark:hover:file:bg-green-900/50" />
          </div>
        </div>
      </div>

      {/* Statistiques données */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-blue-50 dark:bg-blue-900/30 px-6 py-4 border-b border-blue-100 dark:border-blue-800 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-blue-700 dark:text-blue-300" />
          <h3 className="font-semibold text-blue-800 dark:text-blue-200">Données enregistrées</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Toutes les données sont sauvegardées localement dans le navigateur (localStorage).</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
            {stats.map(s => (
              <div key={s.label} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
           <div className="border-t border-gray-100 dark:border-gray-700 pt-4 flex flex-col sm:flex-row gap-3">
             <button onClick={handleBackup} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
               <Download className="w-4 h-4" /> Sauvegarder la base de données
             </button>
             <button onClick={() => setResetConfirm(true)} className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-red-200 dark:border-red-800">
               <Trash2 className="w-4 h-4" /> Réinitialiser toutes les données
             </button>
           </div>
           <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">⚠️ L'action de réinitialisation supprimera toutes vos données et restaurera les données d'exemple.</p>
        </div>
      </div>

      {/* Changer le mot de passe */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-gray-600 flex items-center gap-3" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
          <Lock className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-red-700">Changer le mot de passe</h3>
        </div>
        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Mot de passe actuel</label>
              <input type="password" value={passwordForm.current_password} onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:bg-gray-700 dark:text-gray-200" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Nouveau mot de passe</label>
              <input type="password" value={passwordForm.new_password} onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:bg-gray-700 dark:text-gray-200" required minLength={8} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Confirmer le mot de passe</label>
              <input type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200 dark:bg-gray-700 dark:text-gray-200" required />
            </div>
          </div>
          <button type="submit" className="flex items-center gap-2 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors bg-red-600 hover:bg-red-700">
            <Lock className="w-4 h-4" /> Changer le mot de passe
          </button>
        </form>
      </div>

      {/* Info card */}
      <div className="rounded-xl p-6 text-white" style={{ background: `linear-gradient(135deg, ${form.primaryColor || '#0d9488'}cc, ${form.primaryColor || '#0d9488'})` }}>
        <div className="flex items-center gap-4 mb-4">
          {form.logo && <img src={form.logo} alt="Logo" className="w-14 h-14 rounded-xl object-contain bg-white/20 p-1" />}
          <div>
            <h3 className="font-bold text-lg">{form.nom}</h3>
            <p className="text-green-200 text-sm">{form.slogan}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {form.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-green-300" /><span className="text-green-100">{form.email}</span></div>}
          {form.telephone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-green-300" /><span className="text-green-100">{form.telephone}</span></div>}
          {form.adresse && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-green-300" /><span className="text-green-100">{form.adresse}</span></div>}
          {form.siteWeb && <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-green-300" /><span className="text-green-100">{form.siteWeb}</span></div>}
        </div>
      </div>

      {/* Reset confirm */}
      {resetConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Réinitialiser les données ?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Toutes vos données seront effacées et remplacées par les données d'exemple. Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setResetConfirm(false)} className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
              <button onClick={handleReset} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium">Réinitialiser</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
