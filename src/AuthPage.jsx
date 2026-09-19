import React, { useState } from 'react';
import { registerUser, loginUser } from './auth';

const cls = (...args) => args.filter(Boolean).join(' ');

function InputField({ label, type, value, onChange, placeholder, error }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
        className={cls(
          'w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition',
          'bg-white placeholder-slate-400 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500',
          'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
          error ? 'border-rose-400 dark:border-rose-600' : 'border-slate-300 dark:border-slate-700'
        )}
      />
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

export default function AuthPage({ onLogin, lang }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isEN = lang === 'EN';

  const labels = {
    title_login:    isEN ? 'Welcome back' : 'Selamat datang kembali',
    title_register: isEN ? 'Create your account' : 'Buat akun baru',
    sub_login:      isEN ? 'Sign in to sync your study progress' : 'Masuk untuk menyinkronkan progres belajarmu',
    sub_register:   isEN ? 'Start your Japanese N2 journey' : 'Mulai perjalanan belajar Bahasa Jepang N2 kamu',
    username:       isEN ? 'Username' : 'Username',
    password:       isEN ? 'Password' : 'Password',
    confirm_pw:     isEN ? 'Confirm Password' : 'Konfirmasi Password',
    btn_login:      isEN ? 'Sign In' : 'Masuk',
    btn_register:   isEN ? 'Create Account' : 'Daftar',
    loading:        isEN ? 'Processing...' : 'Memproses...',
    switch_to_reg:  isEN ? "Don't have an account? Register" : 'Belum punya akun? Daftar',
    switch_to_log:  isEN ? 'Already have an account? Sign In' : 'Sudah punya akun? Masuk',
    pw_mismatch:    isEN ? 'Passwords do not match.' : 'Password tidak cocok.',
    success_reg:    isEN ? 'Account created! You can now sign in.' : 'Akun berhasil dibuat! Silakan masuk.',
  };

  const reset = () => { setError(''); setSuccess(''); };

  const handleLogin = async () => {
    reset();
    if (!username.trim() || !password) { setError(isEN ? 'Fill in all fields.' : 'Isi semua field.'); return; }
    setLoading(true);
    const result = await loginUser(username, password);
    setLoading(false);
    if (!result.ok) { setError(isEN ? result.error : mapError(result.error)); return; }
    onLogin(result.user);
  };

  const handleRegister = async () => {
    reset();
    if (!username.trim() || !password) { setError(isEN ? 'Fill in all fields.' : 'Isi semua field.'); return; }
    if (password !== confirm) { setError(labels.pw_mismatch); return; }
    setLoading(true);
    const result = await registerUser(username, password);
    setLoading(false);
    if (!result.ok) { setError(isEN ? result.error : mapError(result.error)); return; }
    setSuccess(labels.success_reg);
    setMode('login');
    setPassword(''); setConfirm('');
  };

  const mapError = (en) => {
    const map = {
      'Username cannot be empty.': 'Username tidak boleh kosong.',
      'Username must be at least 3 characters.': 'Username minimal 3 karakter.',
      'Username already taken.': 'Username sudah digunakan.',
      'Password must be at least 6 characters.': 'Password minimal 6 karakter.',
      'User not found. Check username or register on this device.': 'Pengguna tidak ditemukan. Periksa username atau daftar ulang.',
      'User not found.': 'Pengguna tidak ditemukan.',
      'Incorrect password.': 'Password salah.',
    };
    return map[en] || en;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      {/* App Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
          <span className="font-jp text-2xl font-black text-white">文</span>
        </div>
        <div className="mt-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">N2 Study Lab</span>
            <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-extrabold text-blue-600 dark:bg-blue-950 dark:text-blue-300">Pro</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Japanese Mastery Studio</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{labels[`title_${mode}`]}</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{labels[`sub_${mode}`]}</p>

        {success && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            ✓ {success}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); mode === 'login' ? handleLogin() : handleRegister(); }} className="mt-5 space-y-4">
          <InputField label={labels.username} type="text" value={username} onChange={v => { setUsername(v); reset(); }} placeholder="username" />
          <InputField label={labels.password} type="password" value={password} onChange={v => { setPassword(v); reset(); }} placeholder="••••••••" />
          {mode === 'register' && (
            <InputField label={labels.confirm_pw} type="password" value={confirm} onChange={v => { setConfirm(v); reset(); }} placeholder="••••••••" />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 active:scale-98 disabled:opacity-50"
          >
            {loading ? labels.loading : labels[`btn_${mode}`]}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center dark:border-slate-800">
          <button
            onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); reset(); }}
            className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            {labels[`switch_to_${mode === 'login' ? 'reg' : 'log'}`]}
          </button>
        </div>
      </div>
    </div>
  );
}
