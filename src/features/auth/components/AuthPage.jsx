import React, { useState } from 'react';
import { cls } from '../../../lib/utils';
import { loginUser, registerUser } from '../services/auth.service';

/**
 * InputField Component.
 * Form text input with label, placeholder, and validation error message.
 *
 * @param {object} props
 * @param {string} props.label - Text label for the input.
 * @param {string} props.type - Input type ('text', 'password').
 * @param {string} props.value - Controlled input value.
 * @param {(val: string) => void} props.onChange - Input change callback.
 * @param {string} props.placeholder - Input placeholder text.
 * @param {string} [props.error] - Optional validation error message.
 * @returns {JSX.Element} Rendered form input group.
 */
function InputField({ label, type, value, onChange, placeholder, error }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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

/**
 * AuthPage Component.
 * Authentication card screen supporting:
 *  - User Sign In (login).
 *  - New Account Registration.
 *  - Password confirmation validation.
 *  - Bilingual labels in Indonesian (ID) and English (EN).
 *
 * @param {object} props
 * @param {(user: object) => void} props.onLogin - Callback invoked when login succeeds.
 * @param {'EN'|'ID'} props.lang - Active language code.
 * @returns {JSX.Element} Authentication card screen.
 */
export function AuthPage({ onLogin, lang }) {
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

  const reset = () => { setError(''); setSuccess(''); };

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    reset();
    if (!username.trim() || !password) {
      setError(isEN ? 'Fill in all fields.' : 'Isi semua field.');
      return;
    }
    setLoading(true);
    const result = await loginUser(username, password);
    setLoading(false);
    if (!result.ok) {
      setError(isEN ? result.error : mapError(result.error));
      return;
    }
    onLogin(result.user);
  };

  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    reset();
    if (!username.trim() || !password) {
      setError(isEN ? 'Fill in all fields.' : 'Isi semua field.');
      return;
    }
    if (password !== confirm) {
      setError(labels.pw_mismatch);
      return;
    }
    setLoading(true);
    const result = await registerUser(username, password);
    setLoading(false);
    if (!result.ok) {
      setError(isEN ? result.error : mapError(result.error));
      return;
    }
    setSuccess(labels.success_reg);
    setMode('login');
    setPassword('');
    setConfirm('');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      {/* Brand Header */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/20">
          <span className="font-jp text-2xl font-black text-white">文</span>
        </div>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          JLPT N2 Studio
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Japanese Mastery Studio
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {mode === 'login' ? labels.title_login : labels.title_register}
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {mode === 'login' ? labels.sub_login : labels.sub_register}
        </p>

        {/* Global Feedback Banner */}
        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {success}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={mode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="mt-5 space-y-4">
          <InputField
            label={labels.username}
            type="text"
            value={username}
            onChange={setUsername}
            placeholder="e.g. toni"
          />

          <InputField
            label={labels.password}
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />

          {mode === 'register' && (
            <InputField
              label={labels.confirm_pw}
              type="password"
              value={confirm}
              onChange={setConfirm}
              placeholder="••••••••"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700 active:scale-98 disabled:opacity-50"
          >
            {loading ? labels.loading : mode === 'login' ? labels.btn_login : labels.btn_register}
          </button>
        </form>

        {/* Mode Switcher Link */}
        <div className="mt-5 text-center">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              reset();
            }}
            className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            {mode === 'login' ? labels.switch_to_reg : labels.switch_to_log}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
