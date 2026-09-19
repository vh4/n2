import React from 'react';
import Link from 'next/link';

/**
 * Custom 404 Not Found Page for JLPT N2 Japanese Mastery Studio.
 *
 * Provides:
 *  - High-aesthetic Japanese-themed 404 illustration with Kanji glyph `迷` (Lost/Astray).
 *  - Bilingual guidance in Indonesian and English.
 *  - Quick navigation buttons to return to `/dashboard` or `/login`.
 *
 * @returns {JSX.Element} 404 Not Found screen.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-md text-center">
        {/* Japanese Cultural Kanji Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-500 shadow-2xl shadow-rose-500/20">
          <span className="font-jp text-4xl font-black text-white">迷</span>
        </div>

        {/* Status code and Japanese Header */}
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1 text-xs font-bold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
          <span>404 NOT FOUND</span>
          <span>•</span>
          <span className="font-jp">道に迷いました</span>
        </div>

        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Halaman Tidak Ditemukan
        </h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Tautan yang kamu tuju tidak tersedia atau telah dipindahkan.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500">
          The requested page could not be found or has been moved.
        </p>

        {/* Quick Route Navigation Actions */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-700 active:scale-98 text-center"
          >
            Masuk ke Dashboard
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 text-center"
          >
            Halaman Login
          </Link>
        </div>

        {/* Japanese Vocabulary Hint */}
        <div className="mt-12 rounded-2xl border border-slate-200 bg-white/70 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 text-left">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Kotoba N2 Mini-Lesson
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-jp text-lg font-bold text-slate-900 dark:text-white">迷う</span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">まよう (mayou)</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Kata kerja: Tersesat, bingung, atau bimbang. Contoh: 道に迷ってしまった (Saya tersesat di jalan).
          </p>
        </div>
      </div>
    </div>
  );
}
