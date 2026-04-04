import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calendar, Check, Clock, Baby, Plus, Trash2, AlertCircle, Edit2, Bell, Save, X, LogOut, BarChart3, Download, Printer, Moon, Sun, Award, Shield, Menu, ChevronRight, TrendingUp } from 'lucide-react';

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
  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showAddVaccine, setShowAddVaccine] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(null);
  
  const [vaccineNotes, setVaccineNotes] = useState('');
  const [vaccineReminder, setVaccineReminder] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [newChild, setNewChild] = useState({ name: '', dob: '' });
  const [newVaccine, setNewVaccine] = useState({ 
    name: '', 
    ageMonths: '', 
    description: '',
    notes: ''
  });

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

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      setAuthError(error.message);
    }
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

  const addCustomVaccine = async () => {
    if (!newVaccine.name || !newVaccine.ageMonths) return;

    await supabase.from('vaccines').insert([{
      child_id: selectedChild,
      name: newVaccine.name,
      age_months: parseInt(newVaccine.ageMonths),
      description: newVaccine.description,
      notes: newVaccine.notes,
      completed: false
    }]);

    await loadChildren();
    setNewVaccine({ name: '', ageMonths: '', description: '', notes: '' });
    setShowAddVaccine(false);
  };

  const openCompleteModal = (vaccine) => {
    setShowCompleteModal(vaccine.id);
    setCompletionDate(new Date().toISOString().split('T')[0]);
  };

  const completeVaccine = async () => {
    if (!showCompleteModal) return;
    
    await supabase
      .from('vaccines')
      .update({
        completed: true,
        date_given: completionDate
      })
      .eq('id', showCompleteModal);
    
    await loadChildren();
    setShowCompleteModal(null);
    setCompletionDate('');
  };

  const uncompleteVaccine = async (vaccineId) => {
    await supabase
      .from('vaccines')
      .update({
        completed: false,
        date_given: null
      })
      .eq('id', vaccineId);
    
    await loadChildren();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl"></div>
            <Baby className="relative w-20 h-20 md:w-24 md:h-24 text-white mx-auto mb-4 animate-bounce" />
          </div>
          <p className="text-xl md:text-2xl text-white font-semibold">Loading BabyVax...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 rounded-3xl shadow-2xl p-6 md:p-10 border border-white/20">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-xl">
                  <Baby className="w-10 h-10 md:w-12 md:h-12 text-white" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                BabyVax
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Your child's health companion</p>
            </div>

            {/* Auth Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  authMode === 'login'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  authMode === 'signup'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all mb-4 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-900 text-gray-500">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <div className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Email"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Password"
              />
              {authError && (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
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

            {/* Features */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Track multiple children</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>CDC-based vaccine schedule</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Cloud sync across devices</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50'} transition-colors duration-300`}>
      {/* Mobile Header */}
      <div className={`lg:hidden ${darkMode ? 'bg-gray-800' : 'bg-white/80 backdrop-blur-lg'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} sticky top-0 z-40`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl">
              <Baby className="w-6 h-6 text-white" />
            </div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>BabyVax</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-4 space-y-2`}>
            <button
              onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${
                currentView === 'dashboard'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => { setCurrentView('vaccines'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${
                currentView === 'vaccines'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Shield className="w-5 h-5" />
              Vaccines
            </button>
            <button
              onClick={() => { setShowAddVaccine(true); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-green-600 text-white"
            >
              <Plus className="w-5 h-5" />
              Add Custom Vaccine
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${darkMode ? 'bg-gray-700 text-red-400' : 'bg-red-50 text-red-600'}`}
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Desktop Header */}
        <div className={`hidden lg:block ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/80 backdrop-blur-lg'} rounded-2xl shadow-xl p-6 mb-6 border ${darkMode ? '' : 'border-white/20'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <Baby className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'}`}>BabyVax</h1>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Vaccination Tracking Dashboard</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-700'} hover:scale-110 transition-all`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowAddChild(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
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

          {/* Children Tabs */}
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
                  <div className="flex items-center gap-2">
                    <Baby className="w-4 h-4" />
                    {child.name} ({calculateAge(child.dob)})
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Children Selector */}
        {children.length > 0 && (
          <div className={`lg:hidden ${darkMode ? 'bg-gray-800' : 'bg-white/80 backdrop-blur-lg'} rounded-2xl shadow-lg p-4 mb-4`}>
            <select
              value={selectedChild || ''}
              onChange={(e) => setSelectedChild(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl font-semibold ${
                darkMode
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-white text-gray-800 border-gray-200'
              } border-2 outline-none`}
            >
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.name} ({calculateAge(child.dob)})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation - Desktop */}
        {currentChild && (
          <div className={`hidden lg:block ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/80 backdrop-blur-lg'} rounded-2xl shadow-xl p-4 mb-6 border ${darkMode ? '' : 'border-white/20'}`}>
            <div className="flex gap-2 items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    currentView === 'dashboard'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="w-5 h-5" />
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('vaccines')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    currentView === 'vaccines'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  All Vaccines
                </button>
              </div>
              <button
                onClick={() => setShowAddVaccine(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-green-600 text-white hover:bg-green-700 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Add Custom Vaccine
              </button>
            </div>
          </div>
        )}

        {/* Dashboard View */}
        {currentChild && currentView === 'dashboard' && (
          <div className="space-y-4 lg:space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <div className={`${darkMode ? 'bg-gradient-to-br from-green-900 to-green-800' : 'bg-gradient-to-br from-green-500 to-green-600'} rounded-2xl shadow-xl p-4 lg:p-6 text-white`}>
                <div className="flex flex-col items-center justify-center h-full">
                  <Check className="w-8 h-8 lg:w-10 lg:h-10 mb-2" />
                  <span className="text-2xl lg:text-4xl font-bold">{completionRate}%</span>
                  <p className="text-green-100 text-xs lg:text-sm mt-1">Completed</p>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gradient-to-br from-red-900 to-red-800' : 'bg-gradient-to-br from-red-500 to-red-600'} rounded-2xl shadow-xl p-4 lg:p-6 text-white`}>
                <div className="flex flex-col items-center justify-center h-full">
                  <AlertCircle className="w-8 h-8 lg:w-10 lg:h-10 mb-2" />
                  <span className="text-2xl lg:text-4xl font-bold">{dueCount}</span>
                  <p className="text-red-100 text-xs lg:text-sm mt-1">Due Now</p>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gradient-to-br from-blue-900 to-blue-800' : 'bg-gradient-to-br from-blue-500 to-blue-600'} rounded-2xl shadow-xl p-4 lg:p-6 text-white`}>
                <div className="flex flex-col items-center justify-center h-full">
                  <Clock className="w-8 h-8 lg:w-10 lg:h-10 mb-2" />
                  <span className="text-2xl lg:text-4xl font-bold">{upcomingCount}</span>
                  <p className="text-blue-100 text-xs lg:text-sm mt-1">Upcoming</p>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gradient-to-br from-purple-900 to-purple-800' : 'bg-gradient-to-br from-purple-500 to-purple-600'} rounded-2xl shadow-xl p-4 lg:p-6 text-white`}>
                <div className="flex flex-col items-center justify-center h-full">
                  <Award className="w-8 h-8 lg:w-10 lg:h-10 mb-2" />
                  <span className="text-2xl lg:text-4xl font-bold">{currentChild.vaccines.filter(v => v.completed).length}</span>
                  <p className="text-purple-100 text-xs lg:text-sm mt-1">Total Given</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/80 backdrop-blur-lg'} rounded-2xl shadow-xl p-4 lg:p-6`}>
              <h2 className={`text-xl lg:text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Vaccination Progress
              </h2>
              <div className="relative">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-8 rounded-full transition-all duration-1000 flex items-center justify-end pr-4"
                    style={{ width: `${completionRate}%` }}
                  >
                    <span className="text-white font-bold text-sm">{completionRate}%</span>
                  </div>
                </div>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                {currentChild.vaccines.filter(v => v.completed).length} of {currentChild.vaccines.length} vaccines completed
              </p>
            </div>

            {/* Due Vaccines Preview */}
            {dueCount > 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/80 backdrop-blur-lg'} rounded-2xl shadow-xl p-4 lg:p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl lg:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    Vaccines Due Now
                  </h2>
                  <button
                    onClick={() => setCurrentView('vaccines')}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {groupedVaccines.due.slice(0, 3).map(vaccine => (
                    <div
                      key={vaccine.id}
                      className={`p-4 rounded-xl border-2 ${
                        darkMode ? 'border-red-900 bg-red-900/20' : 'border-red-100 bg-red-50'
                      } flex items-center justify-between`}
                    >
                      <div>
                        <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {vaccine.name}
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {vaccine.description}
                        </p>
                      </div>
                      <button
                        onClick={() => openCompleteModal(vaccine)}
                        className="bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 transition-all"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vaccines View - Same as before but with mobile optimizations */}
        {currentChild && currentView === 'vaccines' && (
          <div className="space-y-4 lg:space-y-6">
            {groupedVaccines?.due?.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/80 backdrop-blur-lg'} rounded-2xl shadow-xl p-4 lg:p-6`}>
                <h2 className={`text-xl lg:text-2xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-red-500" />
                  Due Now ({dueCount})
                </h2>
                <div className="space-y-3">
                  {groupedVaccines.due.map(vaccine => (
                    <div key={vaccine.id} className={`border-2 ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-red-100 bg-red-50/50'} rounded-xl p-4 hover:shadow-lg transition-all`}>
                      {editingVaccine === vaccine.id ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className={`font-bold text-base lg:text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {vaccine.name}
                            </h3>
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Notes
                            </label>
                            <textarea
                              value={vaccineNotes}
                              onChange={(e) => setVaccineNotes(e.target.value)}
                              placeholder="Add notes..."
                              className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none ${
                                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                              }`}
                              rows="3"
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Reminder Date
                            </label>
                            <input
                              type="date"
                              value={vaccineReminder}
                              onChange={(e) => setVaccineReminder(e.target.value)}
                              className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${
                                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'
                              }`}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={saveVaccineDetails}
                              className="flex items-center gap-1 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-all flex-1 justify-center"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingVaccine(null)}
                              className="flex items-center gap-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-400 transition-all flex-1 justify-center"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                          <div className="flex-1 w-full lg:w-auto">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className={`font-bold text-base lg:text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                {vaccine.name}
                              </h3>
                              <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap">
                                {vaccine.age_months === 0 ? 'Birth' : `${vaccine.age_months}m`}
                              </span>
                            </div>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {vaccine.description}
                            </p>
                            {vaccine.notes && (
                              <div className={`mt-2 text-sm p-2 rounded-lg ${
                                darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'
                              }`}>
                                <strong>Notes:</strong> {vaccine.notes}
                              </div>
                            )}
                            {vaccine.reminder && (
                              <div className="mt-2 flex items-center gap-1 text-sm text-amber-600">
                                <Bell className="w-4 h-4" />
                                <span>Reminder: {new Date(vaccine.reminder).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 w-full lg:w-auto">
                            <button
                              onClick={() => openEditVaccine(vaccine)}
                              className="flex-1 lg:flex-none bg-blue-500 text-white px-4 py-3 rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                            >
                              <Edit2 className="w-5 h-5" />
                              <span className="lg:hidden">Edit</span>
                            </button>
                            <button
                              onClick={() => openCompleteModal(vaccine)}
                              className="flex-1 lg:flex-none bg-green-500 text-white px-4 py-3 rounded-xl hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                            >
                              <Check className="w-5 h-5" />
                              <span className="lg:hidden">Complete</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {groupedVaccines?.completed?.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/80 backdrop-blur-lg'} rounded-2xl shadow-xl p-4 lg:p-6`}>
                <h2 className={`text-xl lg:text-2xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <Check className="w-5 h-5 lg:w-6 lg:h-6 text-green-500" />
                  Completed ({groupedVaccines.completed.length})
                </h2>
                <div className="grid gap-3">
                  {groupedVaccines.completed.map(vaccine => (
                    <div key={vaccine.id} className={`border-2 ${darkMode ? 'border-gray-700 bg-green-900/20' : 'border-green-100 bg-green-50/50'} rounded-xl p-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                              {vaccine.name}
                            </h3>
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                              ✓ Done
                            </span>
                          </div>
                          {vaccine.date_given && (
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                              Given: {new Date(vaccine.date_given).toLocaleDateString()}
                            </p>
                          )}
                          {vaccine.notes && (
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                              Notes: {vaccine.notes}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => uncompleteVaccine(vaccine.id)}
                          className="bg-gray-300 text-gray-700 p-2 rounded-lg hover:bg-gray-400 transition-all ml-2"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modals remain the same but with mobile optimization */}
        {/* Complete Vaccine Modal */}
        {showCompleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 lg:p-8 max-w-md w-full shadow-2xl`}>
              <h2 className={`text-xl lg:text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Mark as Complete
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Date Given
                  </label>
                  <input
                    type="date"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl outline-none ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-200 focus:ring-2 focus:ring-indigo-500'
                    }`}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={completeVaccine}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => setShowCompleteModal(null)}
                    className={`flex-1 py-3 rounded-xl font-semibold ${
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

        {/* Add Custom Vaccine Modal */}
        {showAddVaccine && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 lg:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto`}>
              <h2 className={`text-xl lg:text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Add Custom Vaccine
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Vaccine Name *
                  </label>
                  <input
                    type="text"
                    value={newVaccine.name}
                    onChange={(e) => setNewVaccine({...newVaccine, name: e.target.value})}
                    className={`w-full px-4 py-3 border-2 rounded-xl outline-none ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-200 focus:ring-2 focus:ring-indigo-500'
                    }`}
                    placeholder="e.g., COVID-19"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Age (in months) *
                  </label>
                  <input
                    type="number"
                    value={newVaccine.ageMonths}
                    onChange={(e) => setNewVaccine({...newVaccine, ageMonths: e.target.value})}
                    className={`w-full px-4 py-3 border-2 rounded-xl outline-none ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-200 focus:ring-2 focus:ring-indigo-500'
                    }`}
                    placeholder="e.g., 12"
                    min="0"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <input
                    type="text"
                    value={newVaccine.description}
                    onChange={(e) => setNewVaccine({...newVaccine, description: e.target.value})}
                    className={`w-full px-4 py-3 border-2 rounded-xl outline-none ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-200 focus:ring-2 focus:ring-indigo-500'
                    }`}
                    placeholder="e.g., First dose"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Notes
                  </label>
                  <textarea
                    value={newVaccine.notes}
                    onChange={(e) => setNewVaccine({...newVaccine, notes: e.target.value})}
                    className={`w-full px-4 py-3 border-2 rounded-xl outline-none resize-none ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-200 focus:ring-2 focus:ring-indigo-500'
                    }`}
                    placeholder="Additional notes..."
                    rows="3"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={addCustomVaccine}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    Add Vaccine
                  </button>
                  <button
                    onClick={() => {
                      setShowAddVaccine(false);
                      setNewVaccine({ name: '', ageMonths: '', description: '', notes: '' });
                    }}
                    className={`flex-1 py-3 rounded-xl font-semibold ${
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

        {/* Add Child Modal */}
        {showAddChild && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 lg:p-8 max-w-md w-full shadow-2xl`}>
              <h2 className={`text-xl lg:text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Add Child
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Child's Name
                  </label>
                  <input
                    type="text"
                    value={newChild.name}
                    onChange={(e) => setNewChild({...newChild, name: e.target.value})}
                    className={`w-full px-4 py-3 border-2 rounded-xl outline-none transition-all ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-200 focus:ring-2 focus:ring-indigo-500'
                    }`}
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Date of Birth
                  </label>
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
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={addChild}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    Add Child
                  </button>
                  <button
                    onClick={() => {
                      setShowAddChild(false);
                      setNewChild({ name: '', dob: '' });
                    }}
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
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/80 backdrop-blur-lg'} rounded-3xl shadow-xl p-8 lg:p-16 text-center`}>
            <Baby className={`w-20 h-20 lg:w-24 lg:h-24 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-6`} />
            <h2 className={`text-2xl lg:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
              No Children Added Yet
            </h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-8 text-base lg:text-lg max-w-md mx-auto`}>
              Add your child to start tracking their vaccination schedule
            </p>
            <button
              onClick={() => setShowAddChild(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-xl transition-all text-base lg:text-lg font-semibold"
            >
              Add Your First Child
            </button>
          </div>
        )}
      </div>
    </div>
  );
}