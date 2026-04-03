import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calendar, Check, Clock, Baby, Plus, Trash2, AlertCircle, Edit2, Bell, Save, X, LogOut, BarChart3, Download, Printer, Moon, Sun, Award, TrendingUp, Users, Shield } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const standardVaccines = [
  { name: 'Hepatitis B', ageMonths: 0, description: 'First dose at birth', category: 'Hepatitis' },
  { name: 'Hepatitis B', ageMonths: 1, description: 'Second dose', category: 'Hepatitis' },
  { name: 'DTaP', ageMonths: 2, description: 'Diphtheria, Tetanus, Pertussis', category: 'DTaP' },
  { name: 'Hib', ageMonths: 2, description: 'Haemophilus influenzae type b', category: 'Hib' },
  { name: 'IPV', ageMonths: 2, description: 'Polio vaccine', category: 'Polio' },
  { name: 'PCV13', ageMonths: 2, description: 'Pneumococcal vaccine', category: 'Pneumococcal' },
  { name: 'Rotavirus', ageMonths: 2, description: 'Oral vaccine', category: 'Rotavirus' },
  { name: 'DTaP', ageMonths: 4, description: 'Second dose', category: 'DTaP' },
  { name: 'Hib', ageMonths: 4, description: 'Second dose', category: 'Hib' },
  { name: 'IPV', ageMonths: 4, description: 'Second dose', category: 'Polio' },
  { name: 'PCV13', ageMonths: 4, description: 'Second dose', category: 'Pneumococcal' },
  { name: 'Rotavirus', ageMonths: 4, description: 'Second dose', category: 'Rotavirus' },
  { name: 'DTaP', ageMonths: 6, description: 'Third dose', category: 'DTaP' },
  { name: 'Hib', ageMonths: 6, description: 'Third dose', category: 'Hib' },
  { name: 'PCV13', ageMonths: 6, description: 'Third dose', category: 'Pneumococcal' },
  { name: 'IPV', ageMonths: 6, description: 'Third dose', category: 'Polio' },
  { name: 'Hepatitis B', ageMonths: 6, description: 'Third dose', category: 'Hepatitis' },
  { name: 'Influenza', ageMonths: 6, description: 'Yearly vaccine', category: 'Influenza' },
  { name: 'MMR', ageMonths: 12, description: 'Measles, Mumps, Rubella', category: 'MMR' },
  { name: 'Varicella', ageMonths: 12, description: 'Chickenpox vaccine', category: 'Varicella' },
  { name: 'Hepatitis A', ageMonths: 12, description: 'First dose', category: 'Hepatitis' },
  { name: 'Hib', ageMonths: 12, description: 'Booster dose', category: 'Hib' },
  { name: 'PCV13', ageMonths: 12, description: 'Booster dose', category: 'Pneumococcal' },
  { name: 'DTaP', ageMonths: 15, description: 'Fourth dose', category: 'DTaP' },
  { name: 'Hepatitis A', ageMonths: 18, description: 'Second dose', category: 'Hepatitis' },
  { name: 'DTaP', ageMonths: 48, description: 'Fifth dose (4-6 years)', category: 'DTaP' },
  { name: 'IPV', ageMonths: 48, description: 'Booster (4-6 years)', category: 'Polio' },
  { name: 'MMR', ageMonths: 48, description: 'Second dose (4-6 years)', category: 'MMR' },
  { name: 'Varicella', ageMonths: 48, description: 'Second dose (4-6 years)', category: 'Varicella' },
];

export default function BabyVax() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, vaccines, timeline
  
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

  const dueCount = groupedVaccines?.due?.length || 0;
  const upcomingCount = groupedVaccines?.upcoming?.length || 0;

  const exportToPDF = () => {
    alert('PDF export feature coming soon!');
  };

  const printCard = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-center">
          <Baby className="w-20 h-20 text-white mx-auto mb-4 animate-bounce" />
          <p className="text-2xl text-white font-semibold">Loading BabyVax...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="backdrop-blur-lg bg-white/90 rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl inline-block mb-4 shadow-lg">
              <Baby className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">BabyVax</h1>
            <p className="text-gray-600">Your child's health companion</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                authMode === 'signup'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="Email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="Password"
            />
            {authError && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg text-sm">
                {authError}
              </div>
            )}
            <button
              onClick={authMode === 'login' ? handleSignIn : handleSignUp}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:shadow-xl transition-all duration-300 font-semibold"
            >
              {authMode === 'login' ? 'Login' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/80 backdrop-blur-lg'} rounded-2xl shadow-xl p-6 mb-6 border ${darkMode ? '' : 'border-white/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <Baby className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'}`}>BabyVax</h1>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Vaccination Tracking</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-700'} hover:scale-110 transition-all`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowAddChild(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Child
              </button>
              <button
                onClick={handleSignOut}
                className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} hover:scale-110 transition-all`}
              >
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
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    selectedChild === child.id
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                      : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {child.name} ({calculateAge(child.dob)})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        {currentChild && (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/80 backdrop-blur-lg'} rounded-2xl shadow-xl p-4 mb-6 border ${darkMode ? '' : 'border-white/20'}`}>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    : darkMode
                    ? 'text-gray-400 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('vaccines')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  currentView === 'vaccines'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    : darkMode
                    ? 'text-gray-400 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Shield className="w-5 h-5" />
                Vaccines
              </button>
              <button
                onClick={() => setCurrentView('timeline')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  currentView === 'timeline'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    : darkMode
                    ? 'text-gray-400 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-5 h-5" />
                Timeline
              </button>
            </div>
          </div>
        )}

        {/* Dashboard View */}
        {currentChild && currentView === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`${darkMode ? 'bg-gradient-to-br from-green-900 to-green-800' : 'bg-gradient-to-br from-green-500 to-green-600'} rounded-2xl shadow-xl p-6 text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <Check className="w-8 h-8" />
                  <span className="text-3xl font-bold">{completionRate}%</span>
                </div>
                <p className="text-green-100">Completed</p>
              </div>

              <div className={`${darkMode ? 'bg-gradient-to-br from-red-900 to-red-800' : 'bg-gradient-to-br from-red-500 to-red-600'} rounded-2xl shadow-xl p-6 text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="w-8 h-8" />
                  <span className="text-3xl font-bold">{dueCount}</span>
                </div>
                <p className="text-red-100">Due Now</p>
              </div>

              <div className={`${darkMode ? 'bg-gradient-to-br from-blue-900 to-blue-800' : 'bg-gradient-to-br from-blue-500 to-blue-600'} rounded-2xl shadow-xl p-6 text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8" />
                  <span className="text-3xl font-bold">{upcomingCount}</span>
                </div>
                <p className="text-blue-100">Upcoming</p>
              </div>

              <div className={`${darkMode ? 'bg-gradient-to-br from-purple-900 to-purple-800' : 'bg-gradient-to-br from-purple-500 to-purple-600'} rounded-2xl shadow-xl p-6 text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <Award className="w-8 h-8" />
                  <span className="text-3xl font-bold">{currentChild.vaccines.filter(v => v.completed).length}</span>
                </div>
                <p className="text-purple-100">Total Vaccines</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/80 backdrop-blur-lg'} rounded-2xl shadow-xl p-6`}>
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Vaccination Progress</h2>
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-6 rounded-full transition-all duration-1000 flex items-center justify-end pr-3"
                    style={{ width: `${completionRate}%` }}
                  >
                    <span className="text-white font-bold text-sm">{completionRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/80 backdrop-blur-lg'} rounded-2xl shadow-xl p-6`}>
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={exportToPDF}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  <Download className="w-6 h-6" />
                  <span className="font-semibold">Export PDF</span>
                </button>
                <button
                  onClick={printCard}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  <Printer className="w-6 h-6" />
                  <span className="font-semibold">Print Card</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vaccines View */}
        {currentChild && currentView === 'vaccines' && (
          <div className="space-y-6">
            {groupedVaccines?.due?.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/80 backdrop-blur-lg'} rounded-2xl shadow-xl p-6`}>
                <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <Clock className="w-6 h-6 text-red-500" />
                  Due Now
                </h2>
                <div className="space-y-3">
                  {groupedVaccines.due.map(vaccine => (
                    <div key={vaccine.id} className={`border-2 ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-red-100 bg-red-50/50'} rounded-xl p-4 hover:shadow-lg transition-all`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>{vaccine.name}</h3>
                            <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                              {vaccine.age_months === 0 ? 'Birth' : `${vaccine.age_months}m`}
                            </span>
                          </div>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{vaccine.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditVaccine(vaccine)}
                            className="bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-600 transition-all"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => toggleVaccine(vaccine.id)}
                            className="bg-green-500 text-white p-3 rounded-xl hover:bg-green-600 transition-all"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {groupedVaccines?.completed?.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/80 backdrop-blur-lg'} rounded-2xl shadow-xl p-6`}>
                <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <Check className="w-6 h-6 text-green-500" />
                  Completed ({groupedVaccines.completed.length})
                </h2>
                <div className="grid gap-3">
                  {groupedVaccines.completed.slice(0, 5).map(vaccine => (
                    <div key={vaccine.id} className={`border-2 ${darkMode ? 'border-gray-700 bg-green-900/20' : 'border-green-100 bg-green-50/50'} rounded-xl p-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{vaccine.name}</h3>
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              ✓ Done
                            </span>
                          </div>
                          {vaccine.date_given && (
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                              Given: {new Date(vaccine.date_given).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline View */}
        {currentChild && currentView === 'timeline' && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/80 backdrop-blur-lg'} rounded-2xl shadow-xl p-6`}>
            <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Vaccination Timeline</h2>
            <div className="space-y-4">
              {standardVaccines.reduce((acc, vaccine) => {
                if (!acc.find(v => v.ageMonths === vaccine.ageMonths)) {
                  acc.push(vaccine);
                }
                return acc;
              }, []).sort((a, b) => a.ageMonths - b.ageMonths).map((milestone, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full ${darkMode ? 'bg-purple-600' : 'bg-purple-500'}`}></div>
                    {index < standardVaccines.length - 1 && (
                      <div className={`w-1 h-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className={`font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'} mb-2`}>
                      {milestone.ageMonths === 0 ? 'At Birth' : `${milestone.ageMonths} Months`}
                    </div>
                    <div className="space-y-2">
                      {standardVaccines.filter(v => v.ageMonths === milestone.ageMonths).map((v, i) => (
                        <div key={i} className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          • {v.name} - {v.description}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Child Modal */}
        {showAddChild && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-8 max-w-md w-full shadow-2xl`}>
              <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Add Child</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newChild.name}
                  onChange={(e) => setNewChild({...newChild, name: e.target.value})}
                  className={`w-full px-4 py-3 border-2 rounded-xl outline-none transition-all ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200 focus:ring-2 focus:ring-indigo-500'
                  }`}
                  placeholder="Child's Name"
                />
                <input
                  type="date"
                  value={newChild.dob}
                  onChange={(e) => setNewChild({...newChild, dob: e.target.value})}
                  className={`w-full px-4 py-3 border-2 rounded-xl outline-none transition-all ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-200 focus:ring-2 focus:ring-indigo-500'
                  }`}
                />
                <div className="flex gap-3">
                  <button
                    onClick={addChild}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    Add Child
                  </button>
                  <button
                    onClick={() => setShowAddChild(false)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Children State */}
        {!currentChild && children.length === 0 && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/80 backdrop-blur-lg'} rounded-3xl shadow-xl p-16 text-center`}>
            <Baby className={`w-24 h-24 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-6`} />
            <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>No Children Added Yet</h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-8 text-lg`}>
              Add your child to start tracking their vaccination schedule
            </p>
            <button
              onClick={() => setShowAddChild(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-xl transition-all text-lg font-semibold"
            >
              Add Your First Child
            </button>
          </div>
        )}
      </div>
    </div>
  );
}