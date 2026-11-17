import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Shield,
  FileCheck,
  Cpu,
  Layers,
  MapPin,
  Phone,
  Factory,
  Check,
  Sparkles
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ERPRole } from '../../types/erp';

type AuthMode = 'login' | 'signup' | 'reset';
type OnboardingStep = 1 | 2 | 3 | 4;

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const INDIAN_STATES = [
  { name: 'Maharashtra', code: '27' },
  { name: 'Gujarat', code: '24' },
  { name: 'Karnataka', code: '29' },
  { name: 'Tamil Nadu', code: '33' },
  { name: 'Haryana', code: '06' },
  { name: 'Rajasthan', code: '08' },
  { name: 'Uttar Pradesh', code: '09' },
  { name: 'Delhi', code: '07' },
  { name: 'Madhya Pradesh', code: '23' },
  { name: 'Telangana', code: '36' },
  { name: 'Andhra Pradesh', code: '37' },
  { name: 'Punjab', code: '03' },
  { name: 'West Bengal', code: '19' }
];

const MANUFACTURING_SECTORS = [
  'CNC Machining & Precision Turning',
  'Automotive Components & Ancillaries',
  'Sheet Metal & Laser Fabrication',
  'Tool, Die & Mold Making',
  'Plastics & Injection Molding',
  'Electrical & Electronic Assemblies',
  'General Engineering & Job Shop'
];

export const AuthPage: React.FC = () => {
  const {
    login,
    onboard,
    loginWithGoogle,
    pendingGoogleProfile,
    clearPendingGoogleProfile
  } = useERP();

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sign In State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Progressive Onboarding Form State
  const [onboardForm, setOnboardForm] = useState({
    // Step 1: Owner Profile
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    authProvider: 'email' as 'email' | 'google',
    // Step 2: Factory Details
    companyName: '',
    industry: 'CNC Machining & Precision Turning',
    companyCode: '',
    // Step 3: Location & GSTIN
    state: 'Maharashtra',
    stateCode: '27',
    city: 'Pune',
    address: '',
    pincode: '',
    gstin: '',
    pan: '',
    // Step 4: Scale & Modules
    scale: 'small' as 'micro' | 'small' | 'medium',
    selectedModules: [
      'crm',
      'quotations',
      'sales',
      'purchase',
      'inventory',
      'manufacturing',
      'finance',
      'reports'
    ],
    agreeTerms: true
  });

  // Reset State
  const [resetEmail, setResetEmail] = useState('');

  // Load saved email on mount
  useEffect(() => {
    const saved = localStorage.getItem('house_msme_email');
    if (saved) {
      setLoginEmail(saved);
      setRememberMe(true);
    }
  }, []);

  // When a Google profile is detected from OAuth listener
  useEffect(() => {
    if (pendingGoogleProfile) {
      setOnboardForm(prev => ({
        ...prev,
        name: pendingGoogleProfile.name || prev.name,
        email: pendingGoogleProfile.email || prev.email,
        authProvider: 'google'
      }));
      // If user was on login, switch to signup with clear message
      setAuthMode('signup');
      setOnboardingStep(1);
      setErrorMsg('');
      setSuccessMsg(`Google account verified: ${pendingGoogleProfile.email}. Complete registration to set up your workspace.`);
    }
  }, [pendingGoogleProfile]);

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setOnboardingStep(1);
    setErrorMsg('');
    setSuccessMsg('');
    if (mode === 'login' && pendingGoogleProfile) {
      clearPendingGoogleProfile();
    }
  };

  // Google OAuth Trigger
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      const res = await loginWithGoogle();
      if (!res.success && res.error && res.error !== 'Cancelled') {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google authentication failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Email/Password Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg('Please enter both your work email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    if (rememberMe) {
      localStorage.setItem('house_msme_email', loginEmail.trim());
    } else {
      localStorage.removeItem('house_msme_email');
    }

    try {
      const res = await login(loginEmail.trim(), loginPassword);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid credentials. If you are new here, please create an account.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to connect to server. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Auto-derive Plant Code from Company Name
  const handleCompanyNameChange = (val: string) => {
    const derivedCode = val
      .split(' ')
      .filter(w => w.length > 0)
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 4);

    setOnboardForm(prev => ({
      ...prev,
      companyName: val,
      companyCode: prev.companyCode === '' || prev.companyCode === prev.companyName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4)
        ? derivedCode
        : prev.companyCode
    }));
  };

  // Helper: Auto-detect state & PAN from GSTIN
  const handleGstinChange = (val: string) => {
    const cleanGst = val.toUpperCase().trim();
    let stateCode = onboardForm.stateCode;
    let stateName = onboardForm.state;
    let pan = onboardForm.pan;

    if (cleanGst.length >= 2) {
      const code = cleanGst.slice(0, 2);
      const matched = INDIAN_STATES.find(s => s.code === code);
      if (matched) {
        stateCode = matched.code;
        stateName = matched.name;
      }
    }

    if (cleanGst.length >= 12) {
      pan = cleanGst.slice(2, 12);
    }

    setOnboardForm(prev => ({
      ...prev,
      gstin: cleanGst,
      stateCode,
      state: stateName,
      pan
    }));
  };

  // Step Validation & Forward
  const handleNextStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (onboardingStep === 1) {
      if (!onboardForm.name.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!onboardForm.email.trim()) {
        setErrorMsg('Please enter your work email.');
        return;
      }
      if (onboardForm.authProvider === 'email') {
        if (!onboardForm.password || onboardForm.password.length < 8) {
          setErrorMsg('Password must be at least 8 characters long.');
          return;
        }
        if (onboardForm.password !== onboardForm.confirmPassword) {
          setErrorMsg('Passwords do not match.');
          return;
        }
      }
      setOnboardingStep(2);
      return;
    }

    if (onboardingStep === 2) {
      if (!onboardForm.companyName.trim()) {
        setErrorMsg('Please enter your company name.');
        return;
      }
      setOnboardingStep(3);
      return;
    }

    if (onboardingStep === 3) {
      if (!onboardForm.city.trim()) {
        setErrorMsg('Please enter your city.');
        return;
      }
      if (onboardForm.gstin.trim() && onboardForm.gstin.trim().length !== 15) {
        setErrorMsg('GSTIN must be exactly 15 alphanumeric characters (or leave empty to add later).');
        return;
      }
      setOnboardingStep(4);
      return;
    }
  };

  // Final Onboarding Submission
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardForm.agreeTerms) {
      setErrorMsg('Please accept the industrial operating terms.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await onboard({
        name: onboardForm.name.trim(),
        email: onboardForm.email.trim(),
        phone: onboardForm.phone.trim(),
        password: onboardForm.password,
        authProvider: onboardForm.authProvider,
        companyName: onboardForm.companyName.trim(),
        industry: onboardForm.industry,
        companyCode: onboardForm.companyCode.trim() || 'PLNT',
        city: onboardForm.city.trim(),
        state: onboardForm.state,
        stateCode: onboardForm.stateCode,
        address: onboardForm.address.trim(),
        pincode: onboardForm.pincode.trim(),
        gstin: onboardForm.gstin.trim(),
        pan: onboardForm.pan.trim(),
        scale: onboardForm.scale,
        selectedModules: onboardForm.selectedModules
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Registration failed. This email may already be in use.');
      } else {
        setSuccessMsg('Workspace configured successfully! Launching dashboard...');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error during setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password Handler
  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setErrorMsg('Please enter your registered work email.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMsg(`Password reset instructions sent to ${resetEmail}.`);
    }, 600);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-sans selection:bg-[#0057d2] selection:text-white">

      {/* ── LEFT INDUSTRIAL PANEL (Design Anchor: #022879) ── */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#022879] text-white p-10 xl:p-12 flex-col justify-between relative overflow-hidden shrink-0">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #ffffff 1.5px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Brand Lockup */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-[#0057d2] text-white flex items-center justify-center font-bold text-sm shadow-xs border border-white/20">
            M
          </div>
          <div>
            <div className="text-base font-bold text-white tracking-tight leading-tight">
              Codozent One
            </div>
            <div className="text-[11px] text-blue-200">Industrial Cloud Platform</div>
          </div>
        </div>

        {/* Value Proposition Highlights */}
        <div className="relative z-10 space-y-6 my-auto py-6 max-w-md">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">
              Precision Operations for Indian Industry
            </h1>
            <p className="text-xs text-slate-300 font-normal leading-relaxed">
              Plug-and-play ERP tailored for Indian MSMEs: Fast quotations, shop-floor BOM tracking, vendor procurement, and Section 43B(h) compliance.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-[8px] bg-white/[0.06] border border-white/10">
              <Cpu className="w-4 h-4 text-[#6bc0ff] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Dynamic BOM & Shop Floor Routing</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-normal">
                  Tactile job cards, live CNC production logs, and real-time scrap tracking.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-[8px] bg-white/[0.06] border border-white/10">
              <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Indian Statutory & 43B(h) Ready</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-normal">
                  Automated GSTR-1, GSTR-3B monthly filing and 45-day MSME vendor payment alerts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-[8px] bg-white/[0.06] border border-white/10">
              <Shield className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Strict Multi-Tenant Database Isolation</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-normal">
                  Row-level security policies ensure 100% company data isolation and privacy.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="relative z-10 text-[11px] text-slate-400 flex items-center justify-between border-t border-white/10 pt-4">
          <span>Enterprise Edition · Chakan Industrial Cluster</span>
          <span>DPDP Act 2023</span>
        </div>
      </div>

      {/* ── RIGHT CANVAS (Pure White, Crisp, Progressive Disclosure) ── */}
      <div className="w-full lg:w-7/12 bg-white px-6 py-6 sm:px-12 sm:py-8 lg:px-12 lg:py-8 flex flex-col justify-start items-center overflow-y-auto min-h-screen lg:min-h-0">

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between w-full max-w-[500px] mb-3 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[#0057d2] text-white flex items-center justify-center font-bold text-xs">
              M
            </div>
            <div>
              <div className="text-sm font-bold text-[#000000]">Codozent One</div>
              <div className="text-[10px] text-[#545454]">Industrial ERP</div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Cloud Verified
          </span>
        </div>

        <div className="w-full max-w-[500px] space-y-4 my-auto">

          {/* Mode Switch Tabs */}
          <div className="flex border-b border-[#e5e7eb]">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 pb-2.5 text-xs font-bold transition-colors cursor-pointer text-center relative ${authMode === 'login'
                  ? 'text-[#0057d2] border-b-2 border-[#0057d2]'
                  : 'text-[#545454] hover:text-[#000000]'
                }`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 pb-2.5 text-xs font-bold transition-colors cursor-pointer text-center relative ${authMode === 'signup'
                  ? 'text-[#0057d2] border-b-2 border-[#0057d2]'
                  : 'text-[#545454] hover:text-[#000000]'
                }`}
            >
              Create Account
            </button>
          </div>

          {/* Heading */}
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold text-[#000000] tracking-tight">
              {authMode === 'login' && 'Sign In'}
              {authMode === 'signup' && 'Create Your Account'}
              {authMode === 'reset' && 'Reset Password'}
            </h2>
            <p className="text-xs text-[#545454]">
              {authMode === 'login' && 'Welcome back. Sign in with your credentials or Google account.'}
              {authMode === 'signup' && 'Set up your company workspace in a few simple steps.'}
              {authMode === 'reset' && 'Enter your work email to receive a password reset link.'}
            </p>
          </div>

          {/* New User Alert (When Google Sign In attempted by unregistered user) */}
          {authMode === 'login' && pendingGoogleProfile && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-[8px] text-xs text-amber-900 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-amber-950">
                  No account found for {pendingGoogleProfile.email}
                </div>
                <div className="text-[11px] text-amber-800 leading-normal">
                  This Google account is not registered. Create your account to get started.
                </div>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-[6px] text-xs transition-colors cursor-pointer mt-1"
                >
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Google Verified Banner on Signup */}
          {authMode === 'signup' && onboardForm.authProvider === 'google' && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-[8px] text-xs text-blue-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GoogleIcon />
                <span className="font-semibold text-slate-800">Verified: {onboardForm.email}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Google SSO
              </span>
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-[8px] text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-tight">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-[8px] text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 1: SIGN IN MODE                                            */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {authMode === 'login' && (
            <div className="space-y-3 pt-0.5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                className="w-full py-2 px-3 bg-white hover:bg-[#f5f6f7] border border-[#d1d5db] text-[#223548] text-xs font-semibold rounded-[8px] flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-60 shadow-2xs"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#0057d2]" />
                ) : (
                  <GoogleIcon />
                )}
                <span>Sign in with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#e5e7eb] w-full" />
                <span className="bg-white px-2.5 text-[10px] uppercase font-bold text-[#545454] tracking-wider absolute">
                  or work email
                </span>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-[#223548] uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#545454] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#d1d5db] rounded-[8px] text-[#000000] focus:outline-none focus:border-[#0057d2] focus:ring-1 focus:ring-[#0057d2]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-[#223548] uppercase tracking-wider">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode('reset')}
                      className="text-[11px] text-[#0057d2] hover:underline font-medium cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#545454] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 text-xs bg-white border border-[#d1d5db] rounded-[8px] text-[#000000] focus:outline-none focus:border-[#0057d2] focus:ring-1 focus:ring-[#0057d2]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#545454] hover:text-[#000000] cursor-pointer p-0.5"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[#545454]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#d1d5db] text-[#0057d2] focus:ring-[#0057d2] w-3.5 h-3.5 accent-[#0057d2]"
                    />
                    <span className="text-[11px]">Remember my email</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-[#0057d2] hover:bg-[#0040b0] text-white text-xs font-bold rounded-[8px] flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 shadow-xs active:translate-y-px"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1 text-xs text-[#545454]">
                  <span></span>
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-[#0057d2] font-bold hover:underline cursor-pointer"
                  >
                    Create account ?
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 2: PROGRESSIVE STEP-BY-STEP ONBOARDING WIZARD              */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {authMode === 'signup' && (
            <div className="space-y-4 pt-0.5">

              {/* Progress Indicator: Step 1 to 4 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#000000]">
                    Step {onboardingStep} of 4: {' '}
                    <span className="text-[#0057d2] font-normal">
                      {onboardingStep === 1 && 'Account & Contact'}
                      {onboardingStep === 2 && 'Factory Identity'}
                      {onboardingStep === 3 && 'Location & Statutory'}
                      {onboardingStep === 4 && 'Scale & Activation'}
                    </span>
                  </span>
                  <span className="text-[11px] font-mono text-[#545454]">
                    {onboardingStep * 25}%
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0057d2] transition-all duration-300 rounded-full"
                    style={{ width: `${onboardingStep * 25}%` }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-1 text-[10px] text-center text-[#545454] pt-0.5">
                  <span className={onboardingStep >= 1 ? 'text-[#0057d2] font-bold' : ''}>1. Owner</span>
                  <span className={onboardingStep >= 2 ? 'text-[#0057d2] font-bold' : ''}>2. Factory</span>
                  <span className={onboardingStep >= 3 ? 'text-[#0057d2] font-bold' : ''}>3. Location</span>
                  <span className={onboardingStep >= 4 ? 'text-[#0057d2] font-bold' : ''}>4. Launch</span>
                </div>
              </div>

              {/* Quick Google Sign Up (only on Step 1 if not already verified via Google) */}
              {onboardingStep === 1 && onboardForm.authProvider !== 'google' && (
                <div className="space-y-2.5 pb-1">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || isLoading}
                    className="w-full py-2 px-3 bg-white hover:bg-[#f5f6f7] border border-[#d1d5db] text-[#223548] text-xs font-semibold rounded-[8px] flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#0057d2]" />
                    ) : (
                      <GoogleIcon />
                    )}
                    <span>Fast Sign up with Google</span>
                  </button>

                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-[#e5e7eb] w-full" />
                    <span className="bg-white px-2.5 text-[10px] uppercase font-bold text-[#545454] tracking-wider absolute">
                      or manual setup
                    </span>
                  </div>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────────── */}
              {/* STEP 1: OWNER IDENTITY & CONTACT                             */}
              {/* ──────────────────────────────────────────────────────────── */}
              {onboardingStep === 1 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#223548] uppercase tracking-wider mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-[#545454] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ramesh Patel"
                          value={onboardForm.name}
                          onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
                          className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-[8px] text-[#000000] focus:outline-none focus:border-[#0057d2]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#223548] uppercase tracking-wider mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-[#545454] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          required
                          disabled={onboardForm.authProvider === 'google'}
                          placeholder="ramesh@company.in"
                          value={onboardForm.email}
                          onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                          className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-[8px] text-[#000000] focus:outline-none focus:border-[#0057d2] disabled:bg-slate-50 disabled:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#223548] uppercase tracking-wider mb-1">
                      Mobile / WhatsApp Number
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-[#545454] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={onboardForm.phone}
                        onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value })}
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-[8px] text-[#000000] focus:outline-none focus:border-[#0057d2]"
                      />
                    </div>
                  </div>

                  {/* Password fields only if not Google signup */}
                  {onboardForm.authProvider !== 'google' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#223548] uppercase tracking-wider mb-1">
                          Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="Min 8 characters"
                            value={onboardForm.password}
                            onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })}
                            className="w-full px-2.5 pr-8 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-[8px] text-[#000000] focus:outline-none focus:border-[#0057d2]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#545454] hover:text-[#000000]"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#223548] uppercase tracking-wider mb-1">
                          Confirm Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            placeholder="Repeat password"
                            value={onboardForm.confirmPassword}
                            onChange={(e) => setOnboardForm({ ...onboardForm, confirmPassword: e.target.value })}
                            className="w-full px-2.5 pr-8 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-[8px] text-[#000000] focus:outline-none focus:border-[#0057d2]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#545454] hover:text-[#000000]"
                          >
                            {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleNextStep()}
                      className="w-full py-2.5 px-4 bg-[#0057d2] hover:bg-[#0040b0] text-white text-xs font-bold rounded-[8px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>Continue to Company Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────────── */}
              {/* STEP 2: FACTORY IDENTITY                                     */}
              {/* ──────────────────────────────────────────────────────────── */}
              {onboardingStep === 2 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#223548] uppercase tracking-wider mb-1">
                      Company / Business Name *
                    </label>
                    <div className="relative">
                      <Building2 className="w-3.5 h-3.5 text-[#545454] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Apex Precision Technologies Pvt Ltd"
                        value={onboardForm.companyName}
                        onChange={(e) => handleCompanyNameChange(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-[8px] text-[#000000] focus:outline-none focus:border-[#0057d2]"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      This official name will appear on Quotations, Invoices & Delivery Challans.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#223548] uppercase tracking-wider mb-1">
                      Primary Manufacturing Sector *
                    </label>
                    <select
                      value={onboardForm.industry}
                      onChange={(e) => setOnboardForm({ ...onboardForm, industry: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs bg-white border border-[#d1d5db] rounded-[8px] text-[#000000] focus:outline-none focus:border-[#0057d2]"
                    >
                      {MANUFACTURING_SECTORS.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#223548] uppercase tracking-wider mb-1">
                      Short Code (3-4 Characters)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. APEX"
                      value={onboardForm.companyCode}
                      onChange={(e) => setOnboardForm({ ...onboardForm, companyCode: e.target.value.toUpperCase() })}
                      className="w-full px-2.5 py-1.5 text-xs font-mono uppercase bg-white border border-[#d1d5db] rounded-[8px] text-[#000000] focus:outline-none focus:border-[#0057d2]"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Used as prefix for document numbers: SO, PO, WO and QC tags.
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(1)}
                      className="py-2.5 px-3 border border-[#d1d5db] hover:bg-slate-50 text-[#545454] text-xs font-semibold rounded-[8px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNextStep()}
                      className="flex-1 py-2.5 px-4 bg-[#0057d2] hover:bg-[#0040b0] text-white text-xs font-bold rounded-[8px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>Continue to Location & GST</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────────── */}
              {/* STEP 3: LOCATION & STATUTORY (GSTIN/PAN)                     */}
              {/* ──────────────────────────────────────────────────────────── */}
              {onboardingStep === 3 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#223548] uppercase tracking-wider mb-1">
                        State *
                      </label>
                      <select
                        value={onboardForm.state}
                        onChange={(e) => {
                          const matched = INDIAN_STATES.find(s => s.name === e.target.value);
                          setOnboardForm({
                            ...onboardForm,
                            state: e.target.value,
                            stateCode: matched?.code || '27'
                          });
                        }}
                        className="w-full px-2.5 py-2 text-xs bg-white border border-[#d1d5db] rounded-[8px] text-[#000000] focus:outline-none focus:border-[#0057d2]"
                      >
                        {INDIAN_STATES.map(s => (
                          <option key={s.code} value={s.name}>
                            {s.name} ({s.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#223548] uppercase tracking-wider mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Pune (Chakan MIDC)"
                        value={onboardForm.city}
                        onChange={(e) => setOnboardForm({ ...onboardForm, city: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-[8px] text-[#000000] focus:outline-none focus:border-[#0057d2]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#223548] uppercase tracking-wider mb-1">
                      Business Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Plot No. E-24, Phase 2, Chakan Industrial Area"
                      value={onboardForm.address}
                      onChange={(e) => setOnboardForm({ ...onboardForm, address: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#d1d5db] rounded-[8px] text-[#000000] focus:outline-none focus:border-[#0057d2]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#223548] uppercase tracking-wider mb-1">
                        GSTIN (Optional)
                      </label>
                      <input
                        type="text"
                        maxLength={15}
                        placeholder="27AAACA1234A1Z5"
                        value={onboardForm.gstin}
                        onChange={(e) => handleGstinChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono uppercase bg-white border border-[#d1d5db] rounded-[8px] text-[#000000] focus:outline-none focus:border-[#0057d2]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#223548] uppercase tracking-wider mb-1">
                        PAN
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="AAACA1234A"
                        value={onboardForm.pan}
                        onChange={(e) => setOnboardForm({ ...onboardForm, pan: e.target.value.toUpperCase() })}
                        className="w-full px-2.5 py-1.5 text-xs font-mono uppercase bg-white border border-[#d1d5db] rounded-[8px] text-[#000000] focus:outline-none focus:border-[#0057d2]"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    GSTIN is optional during setup and can be configured later in Company Settings.
                  </span>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(2)}
                      className="py-2.5 px-3 border border-[#d1d5db] hover:bg-slate-50 text-[#545454] text-xs font-semibold rounded-[8px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNextStep()}
                      className="flex-1 py-2.5 px-4 bg-[#0057d2] hover:bg-[#0040b0] text-white text-xs font-bold rounded-[8px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>Continue to Scale & Activation</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────────── */}
              {/* STEP 4: SCALE & MODULE ACTIVATION                            */}
              {/* ──────────────────────────────────────────────────────────── */}
              {onboardingStep === 4 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#223548] uppercase tracking-wider mb-1.5">
                      Business Scale
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'micro', label: 'Micro Unit', range: '< ₹5 Crore' },
                        { id: 'small', label: 'Small Plant', range: '₹5 - 25 Cr' },
                        { id: 'medium', label: 'Medium Enterprise', range: '₹25 - 100 Cr' }
                      ].map(sc => (
                        <button
                          key={sc.id}
                          type="button"
                          onClick={() => setOnboardForm({ ...onboardForm, scale: sc.id as any })}
                          className={`p-2 rounded-[8px] border text-left cursor-pointer transition-colors ${onboardForm.scale === sc.id
                              ? 'border-[#0057d2] bg-blue-50/50 text-[#0057d2]'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                            }`}
                        >
                          <div className="text-xs font-bold">{sc.label}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{sc.range}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#223548] uppercase tracking-wider mb-1.5">
                      Core Business Modules Included
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-[8px] border border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>CRM & Leads</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Quotations & Costing</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Sales Orders & Dispatch</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Procurement & RFQs</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Inventory & Warehousing</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Manufacturing BOM & WO</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-0.5">
                    <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={onboardForm.agreeTerms}
                        onChange={(e) => setOnboardForm({ ...onboardForm, agreeTerms: e.target.checked })}
                        className="rounded border-[#d1d5db] text-[#0057d2] focus:ring-[#0057d2] w-3.5 h-3.5 accent-[#0057d2] mt-0.5 shrink-0"
                      />
                      <span className="text-[11px]">
                        I agree to the <strong>DPDP Act 2023</strong> data isolation policies.
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(3)}
                      className="py-2.5 px-3 border border-[#d1d5db] hover:bg-slate-50 text-[#545454] text-xs font-semibold rounded-[8px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalSubmit}
                      disabled={isLoading}
                      className="flex-1 py-2.5 px-4 bg-[#0057d2] hover:bg-[#0040b0] text-white text-xs font-bold rounded-[8px] flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Setting up workspace...</span>
                        </>
                      ) : (
                        <>
                          <span>Complete Setup & Launch</span>
                          <Sparkles className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="text-center pt-1 text-xs text-[#545454]">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-[#0057d2] font-bold hover:underline cursor-pointer"
                >
                  Sign in here →
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 3: RESET PASSWORD FORM                                     */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {authMode === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-[#223548] uppercase tracking-wider mb-1">
                  Work Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#545454] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#d1d5db] rounded-[8px] text-[#000000] focus:outline-none focus:border-[#0057d2]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#0057d2] hover:bg-[#0040b0] text-white text-xs font-bold rounded-[8px] flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <span>Send Password Reset OTP</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-xs text-[#0057d2] font-bold hover:underline cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

        </div>

      </div>

    </div>
  );
};
