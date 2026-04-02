import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calendar, Check, Clock, Baby, Plus, Trash2, AlertCircle, Edit2, Bell, Save, X, LogOut } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const standardVaccines = [
  { name: 'Hepatitis B', ageMonths: 0, description: 'First dose at birth' },
  { name: 'Hepatitis B', ageMonths: 1, description: 'Second dose' },
  { name: 'DTaP', ageMonths: 2, description: 'Diphtheria, Tetanus, Pertussis' },
  { name: 'Hib', ageMonths: 2, description: 'Haemophilus influenzae type b' },
  { name: 'IPV', ageMonths: 2, description: 'Polio vaccine' },
  { name: 'PCV13', ageMonths: 2, description: 'Pneumococcal vaccine' },
  { name: 'Rotavirus', ageMonths: 2, description: 'Oral vaccine' },
  { name: 'DTaP', ageMonths: 4, description: 'Second dose' },
  { name: 'Hib', ageMonths: 4, description: 'Second dose' },
  { name: 'IPV', ageMonths: 4, description: 'Second dose' },
  { name: 'PCV13', ageMonths: 4, description: 'Second dose' },
  { name: 'Rotavirus', ageMonths: 4, description: 'Second dose' },
  { name: 'DTaP', ageMonths: 6, description: 'Third dose' },
  { name: 'Hib', ageMonths: 6, description: 'Third dose' },
  { name: 'PCV13', ageMonths: 6, description: 'Third dose' },
  { name: 'IPV', ageMonths: 6, description: 'Third dose' },
  { name: 'Hepatitis B', ageMonths: 6, description: 'Third dose' },
  { name: 'Influenza', ageMonths: 6, description: 'Yearly vaccine' },
  { name: 'MMR', ageMonths: 12, description: 'Measles, Mumps, Rubella' },
  { name: 'Varicella', ageMonths: 12, description: 'Chickenpox vaccine' },
  { name: 'Hepatitis A', ageMonths: 12, description: 'First dose' },
  { name: 'Hib', ageMonths: 12, description: 'Booster dose' },
  { name: 'PCV13', ageMonths: 12, description: 'Booster dose' },
  { name: 'DTaP', ageMonths: 15, description: 'Fourth dose' },
  { name: 'Hepatitis A', ageMonths: 18, description: 'Second dose' },
  { name: 'DTaP', ageMonths: 48, description: 'Fifth dose (4-6 years)' },
  { name: 'IPV', ageMonths: 48, description: 'Booster (4-6 years)' },
  { name: 'MMR', ageMonths: 48, description: 'Second dose (4-6 years)' },
  { name: 'Varicella', ageMonths: 48, description: 'Second dose (4-6 years)' },
];

export default function BabyVax() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showAddChild, setShowAddChild] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState(null);
  const [vaccineNotes, setVaccineNotes] = useState('');
  const [vaccineReminder, setVaccineReminder] = useState('');
  const [newChild, setNewChild] = useState({ name: '', dob: '' });

  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadChildren();
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  };

  const handleSignUp = async () => {
    setAuthError('');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setAuthError(error.message);
    } else {
      alert('Check your email for verification link!');
    }
  };

  const handleSignIn = async () => {
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setChildren([]);
    setSelectedChild(null);
  };

  const loadChildren = async () => {
    const { data: childrenData } = await supabase
      .from('children')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (childrenData) {
      const childrenWithVaccines = await Promise.all(
        childrenData.map(async (child) => {
          const { data: vaccinesData } = await supabase
            .from('vaccines')
            .select('*')
            .eq('child_id', child.id)
            .order('age_months', { ascending: true });
          
          return {
            ...child,
            vaccines: vaccinesData || [],
          };
        })
      );
      
      setChildren(childrenWithVaccines);
      if (!selectedChild && childrenWithVaccines.length > 0) {
        setSelectedChild(childrenWithVaccines[0].id);
      }
    }
  };

  const addChild = async () => {
    if (!newChild.name || !newChild.dob) return;

    const { data: childData } = await supabase
      .from('children')
      .insert([{ name: newChild.name, dob: newChild.dob, user_id: user.id }])
      .select()
      .single();

    if (childData) {
      const vaccinesData = standardVaccines.map(v => ({
        child_id: childData.id,
        name: v.name,
        age_months: v.ageMonths,
        description: v.description,
      }));

      await supabase.from('vaccines').insert(vaccinesData);
      await loadChildren();
      setSelectedChild(childData.id);
      setNewChild({ name: '', dob: '' });
      setShowAddChild(false);
    }
  };

  const deleteChild = async (childId) => {
    if (!confirm('Delete this child\'s records?')) return;
    await supabase.from('children').delete().eq('id', childId);
    await loadChildren();
    setSelectedChild(children.length > 1 ? children.find(c => c.id !== childId)?.id : null);
  };

  const toggleVaccine = async (vaccineId) => {
    const child = children.find(c => c.id === selectedChild);
    const vaccine = child?.vaccines.find(v => v.id === vaccineId);
    
    if (vaccine) {
      await supabase
        .from('vaccines')
        .update({
          completed: !vaccine.completed,
          date_given: !vaccine.completed ? new Date().toISOString().split('T')[0] : null,
        })
        .eq('id', vaccineId);
      
      await loadChildren();
    }
  };

  const openEditVaccine = (vaccine) => {
    setEditingVaccine(vaccine.id);
    setVaccineNotes(vaccine.notes || '');
    setVaccineReminder(vaccine.reminder || '');
  };

  const saveVaccineDetails = async () => {
    if (editingVaccine) {
      await supabase
        .from('vaccines')
        .update({ notes: vaccineNotes, reminder: vaccineReminder || null })
        .eq('id', editingVaccine);
      
      await loadChildren();
      setEditingVaccine(null);
      setVaccineNotes('');
      setVaccineReminder('');
    }
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                   (today.getMonth() - birthDate.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) return `${months} months`;
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years}y ${remainingMonths}m`;
  };

  const getVaccineStatus = (vaccine, dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                        (today.getMonth() - birthDate.getMonth());
    
    if (vaccine.completed) return 'completed';
    if (ageInMonths >= vaccine.age_months) return 'due';
    return 'upcoming';
  };

  const currentChild = children.find(c => c.id === selectedChild);
  const groupedVaccines = currentChild?.vaccines.reduce((acc, vaccine) => {
    const status = getVaccineStatus(vaccine, currentChild.dob);
    if (!acc[status]) acc[status] = [];
    acc[status].push(vaccine);
    return acc;
  }, {});

  const completionRate = currentChild 
    ? Math.round((currentChild.vaccines.filter(v => v.completed).length / currentChild.vaccines.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Baby className="w-16 h-16 text-indigo-600 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Baby className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">BabyVax</h1>
            <p className="text-gray-600">Track your child's vaccinations</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-lg ${authMode === 'login' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 rounded-lg ${authMode === 'signup' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Password"
            />
            {authError && <div className="text-red-600 text-sm">{authError}</div>}
            <button
              onClick={authMode === 'login' ? handleSignIn : handleSignUp}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
            >
              {authMode === 'login' ? 'Login' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Baby className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-3xl font-bold">BabyVax</h1>
                <p className="text-gray-600">Track vaccinations</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddChild(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg"
              >
                <Plus className="w-5 h-5" />
                Add Child
              </button>
              <button onClick={handleSignOut} className="bg-gray-200 px-4 py-2 rounded-lg">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {children.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child.id)}
                  className={`px-4 py-2 rounded-lg ${selectedChild === child.id ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                >
                  {child.name} ({calculateAge(child.dob)})
                </button>
              ))}
            </div>
          )}
        </div>

        {currentChild && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Progress: {completionRate}%</h2>
            <div className="space-y-3">
              {groupedVaccines?.due?.map(v => (
                <div key={v.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{v.name}</h3>
                    <p className="text-sm text-gray-600">{v.description}</p>
                  </div>
                  <button
                    onClick={() => toggleVaccine(v.id)}
                    className="bg-green-500 text-white p-2 rounded-lg"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {showAddChild && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Add Child</h2>
              <input
                type="text"
                value={newChild.name}
                onChange={(e) => setNewChild({...newChild, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg mb-4"
                placeholder="Name"
              />
              <input
                type="date"
                value={newChild.dob}
                onChange={(e) => setNewChild({...newChild, dob: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg mb-4"
              />
              <div className="flex gap-2">
                <button onClick={addChild} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg">
                  Add
                </button>
                <button onClick={() => setShowAddChild(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}