import React, { useState, useEffect } from 'react';
import { X, Bell, Volume2, Sparkles } from 'lucide-react';

interface MorningAlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardNumber?: string;
}

// Simple pleasant chime using browser Web Audio API
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const now = ctx.currentTime;

    // Tone 1: High crisp bell (587.33 Hz - D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.8);

    // Tone 2: Harmonic complement (880 Hz - A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.15);
    gain2.gain.setValueAtTime(0.2, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 1.2);
  } catch {
    // AudioContext blocked or unsupported
  }
}

export const MorningAlarmModal: React.FC<MorningAlarmModalProps> = ({
  isOpen,
  onClose,
  wardNumber = 'Ward 48',
}) => {
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [alarmTime, setAlarmTime] = useState('07:15');
  const [playAudio, setPlayAudio] = useState(true);
  const [testTriggered, setTestTriggered] = useState(false);
  const [_notificationStatus, setNotificationStatus] = useState<string>('default');

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ecosync-morning-alarm');
        if (saved) {
          const parsed = JSON.parse(saved);
          setAlarmEnabled(Boolean(parsed.enabled));
          setAlarmTime(parsed.time || '07:15');
          setPlayAudio(Boolean(parsed.playAudio));
        }
      } catch {
        // ignore
      }
      if ('Notification' in window) {
        setNotificationStatus(Notification.permission);
      }
    }
  }, [isOpen]);

  const savePreferences = () => {
    try {
      localStorage.setItem(
        'ecosync-morning-alarm',
        JSON.stringify({ enabled: alarmEnabled, time: alarmTime, playAudio })
      );
    } catch {
      // ignore
    }
    onClose();
  };

  const handleTestAlarm = async () => {
    setTestTriggered(true);

    if (playAudio) {
      playChime();
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('EcoSync Morning Collection Alarm ⏰', {
          body: `BMC collection tipper is arriving in ~15 mins in ${wardNumber}! Please place your Green (wet) & Blue (dry) bins outside.`,
          icon: '/favicon.ico',
        });
      } else if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        setNotificationStatus(perm);
        if (perm === 'granted') {
          new Notification('EcoSync Morning Collection Alarm ⏰', {
            body: `BMC collection tipper is arriving in ~15 mins in ${wardNumber}! Please place your Green (wet) & Blue (dry) bins outside.`,
            icon: '/favicon.ico',
          });
        }
      }
    }

    setTimeout(() => setTestTriggered(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alarm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-7 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h3 id="alarm-modal-title" className="text-xl font-black text-slate-900 leading-tight">
                Morning Collection Alarm
              </h3>
              <p className="text-xs text-slate-500">
                Daily reminder 15 mins before {wardNumber} sweep
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close alarm modal"
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Alarm Toggle & Time Select */}
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Daily Reminder Active</span>
              <span className="text-[11px] text-slate-500">Alert triggers every morning before pickup</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={alarmEnabled}
                onChange={(e) => setAlarmEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 p-3.5 space-y-1">
              <label htmlFor="alarm-time" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Reminder Time
              </label>
              <select
                id="alarm-time"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                className="w-full font-bold text-sm text-slate-900 bg-transparent border-0 p-0 focus:ring-0"
              >
                <option value="06:45">06:45 AM (Early)</option>
                <option value="07:00">07:00 AM</option>
                <option value="07:15">07:15 AM (Recommended)</option>
                <option value="07:30">07:30 AM</option>
                <option value="08:00">08:00 AM</option>
              </select>
            </div>

            <div className="rounded-2xl border border-slate-200 p-3.5 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Audio Chime
              </span>
              <button
                type="button"
                onClick={() => setPlayAudio(!playAudio)}
                className={`flex items-center gap-1.5 text-xs font-bold ${
                  playAudio ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                <Volume2 className="h-4 w-4" />
                <span>{playAudio ? 'Sound ON 🔔' : 'Muted'}</span>
              </button>
            </div>
          </div>

          {/* Test Notification Button */}
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>Test Alarm &amp; Notification</span>
              </div>
              <button
                type="button"
                onClick={handleTestAlarm}
                className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                {testTriggered ? 'Testing Bell...' : 'Play Test Chime 🔔'}
              </button>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Plays the gentle collection chime and pushes a browser test notification so you know it works on your phone/laptop.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={savePreferences}
            className="rounded-xl bg-[#101828] px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            Save Alarm Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
