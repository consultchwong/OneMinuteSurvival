import React, { useState } from 'react';
import { Lock, KeyRound, X, ShieldAlert, Check } from 'lucide-react';

interface PasskeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPasskey: string;
}

export function PasskeyModal({
  isOpen,
  onClose,
  onSuccess,
  correctPasskey,
}: PasskeyModalProps) {
  const [inputVal, setInputVal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (trimmed === correctPasskey) {
      setErrorMsg('');
      setInputVal('');
      onSuccess();
    } else {
      setErrorMsg('密碼錯誤！請輸入正確的通行證密碼。');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleQuickFill = () => {
    setInputVal(correctPasskey || '8888');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-none">
      <div
        className={`relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl text-slate-100 ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          aria-label="關閉"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lock Crest Icon */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-400/20">
            <KeyRound className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-black bg-gradient-to-r from-amber-300 via-rose-300 to-sky-300 bg-clip-text text-transparent">
              設計工坊 · 密碼驗證
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              進入遊戲數值與關卡自訂模式需要專屬 PASSKEY
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <div className="relative">
              <input
                type="password"
                maxLength={16}
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="請輸入 PASSKEY"
                autoFocus
                className="w-full bg-slate-950/90 border-2 border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-amber-300 placeholder:text-slate-600 focus:outline-none transition shadow-inner"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {errorMsg ? (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2 justify-center">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                <span>預設通行碼: <span className="font-mono text-amber-300 font-bold">{correctPasskey || '8888'}</span></span>
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
                >
                  一鍵填入
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition cursor-pointer border border-yellow-200"
            >
              解鎖進入 (UNLOCK)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
