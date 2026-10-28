import React, { useState, useEffect } from 'react';
import { db } from '../services/storage';
import { Button, Input, Toast } from '../components/DesignSystem';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ShieldCheck, User, Store, Phone, KeyRound, LogOut } from 'lucide-react';

export const Profile: React.FC = () => {
  const { signOut, user, isBypassed } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [bizName, setBizName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as const });

  useEffect(() => {
    const data = db.getProfile();
    if (data) {
      setProfile(data);
      setBizName(data.businessName || '');
      setFullName(data.fullName || '');
      setPhone(data.phone || '');
    } else {
      const mockProfile = {
        fullName: 'Mama Dlamini',
        businessName: 'Mama Dlamini Spaza Store',
        phone: '071 234 5678',
        operatorCode: 'OP-78219'
      };
      setProfile(mockProfile);
      setFullName(mockProfile.fullName);
      setBizName(mockProfile.businessName);
      setPhone(mockProfile.phone);
      db.saveProfile(mockProfile);
    }
  }, []);

  const handleSave = async () => {
    const updated = {
      ...profile,
      fullName: fullName,
      businessName: bizName,
      phone: phone
    };
    db.saveProfile(updated);
    setProfile(updated);
    
    if (user && !user.id.startsWith('guest-') && !user.id.startsWith('demo-')) {
      try {
        await supabase.from('profiles').update({
          business_name: bizName,
          phone: phone,
        }).eq('id', user.id);
        
        await supabase.auth.updateUser({
           data: {
             fullName: fullName,
             businessName: bizName,
             phone: phone
           }
        });
      } catch (e) {
        console.warn('Failed to sync profile to cloud', e);
      }
    }

    setToast({ show: true, message: 'Settings saved to enterprise profile', type: 'success' });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <Toast show={toast.show} message={toast.message} type={toast.type} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-neutral-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Enterprise Settings & Identity
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Registered business credentials, verification pass & security controls
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className={`w-1.5 h-1.5 rounded-full ${isBypassed ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <span className="text-neutral-600 font-medium">
            {isBypassed ? 'Guest Mode (Auth Bypassed)' : 'Supabase Authenticated'}
          </span>
        </div>
      </div>
      
      {/* Identity Summary Card */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-neutral-200/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
              MD
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">{profile.businessName}</h3>
              <p className="text-xs text-neutral-500">{profile.fullName} · Primary Operator</p>
            </div>
          </div>

          <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl px-3.5 py-2 self-start sm:self-auto">
            <span className="text-[10px] font-semibold uppercase text-neutral-400 block tracking-wider">
              Operator Identifier
            </span>
            <span className="font-mono text-xs font-bold text-neutral-900">
              {profile.operatorCode}
            </span>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <Input 
            label="Operator Full Name" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            icon={<User size={14} />}
          />
          <Input 
            label="Trading Business Name" 
            value={bizName} 
            onChange={(e) => setBizName(e.target.value)} 
            icon={<Store size={14} />}
          />
          <Input 
            label="Mobile Notification Line" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            icon={<Phone size={14} />}
          />
        </div>

        {/* Account Details Box */}
        {user && (
          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/70 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-neutral-500">
              <span>Account Email</span>
              <span className="font-mono text-neutral-900">{user.email || 'guest.operator@ibos.africa'}</span>
            </div>
            <div className="flex justify-between items-center text-neutral-500">
              <span>Cloud Identity Hash</span>
              <span className="font-mono text-neutral-900 truncate max-w-[200px]">{user.id}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Button fullWidth onClick={handleSave} variant="primary">
            Save Changes
          </Button>
          <Button 
            fullWidth 
            onClick={signOut} 
            variant="secondary"
          >
            <LogOut size={13} className="mr-1.5" /> Sign Out / Switch User
          </Button>
        </div>
      </div>
    </div>
  );
};
