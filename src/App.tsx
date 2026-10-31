/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Volume2,
  VolumeX,
  Bell,
  Clock,
  Flame,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Tv,
  X,
} from 'lucide-react';
import { MasterChefLogo } from './components/MasterChefLogo';
import { soundEngine, AlertSoundType } from './utils/soundEngine';

interface TriggeredAlert {
  id: string;
  timeRemainingSec: number;
  label: string;
  subtitle: string;
  type: AlertSoundType;
  triggeredAt: string;
}

interface MilestoneItem {
  seconds: number;
  label: string;
  category: '15min' | '10min' | '5min' | '1min';
  soundType: AlertSoundType;
}

const PRESET_PROVAS = [
  { label: '15 Min', sub: 'Prova Rápida', seconds: 15 * 60 },
  { label: '30 Min', sub: 'Caixa Express', seconds: 30 * 60 },
  { label: '45 Min', sub: 'Eliminação', seconds: 45 * 60 },
  { label: '60 Min', sub: 'Caixa Misteriosa', seconds: 60 * 60 },
  { label: '75 Min', sub: 'Prova Técnica', seconds: 75 * 60 },
  { label: '90 Min', sub: 'Grande Final', seconds: 90 * 60 },
  { label: '120 Min', sub: 'Banquete Real', seconds: 120 * 60 },
];

function formatTimeParts(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    hasHours: hours > 0,
  };
}

function formatClockLabel(totalSeconds: number) {
  const { hours, minutes, seconds, hasHours } = formatTimeParts(totalSeconds);
  return hasHours ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

export default function App() {
  // Default 60 minutes (3600 seconds) - Classic MasterChef challenge
  const [initialDuration, setInitialDuration] = useState<number>(60 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(60 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Custom time selector inputs
  const [customHours, setCustomHours] = useState<number>(1);
  const [customMinutes, setCustomMinutes] = useState<number>(0);
  const [customSeconds, setCustomSeconds] = useState<number>(0);

  // Audio settings (Purely sound effects, no voice)
  const [soundMuted, setSoundMuted] = useState<boolean>(false);

  // Fullscreen with ONLY the clock
  const [isClockOnlyFullscreen, setIsClockOnlyFullscreen] = useState<boolean>(false);

  // Active banner alert & history log
  const [activeBanner, setActiveBanner] = useState<TriggeredAlert | null>(null);
  const [alertHistory, setAlertHistory] = useState<TriggeredAlert[]>([]);

  // Track which second marks have already fired in the current run
  const firedMarksRef = useRef<Set<number>>(new Set());
  const bannerTimeoutRef = useRef<number | null>(null);

  // Calculate all programmed milestones:
  // - Every 15 minutes (15 em 15 min)
  // - Last 10 minutes (600s)
  // - Last 5 minutes (300s)
  // - Last 1 minute (60s)
  const milestones = useMemo<MilestoneItem[]>(() => {
    const map = new Map<number, MilestoneItem>();

    // 1. 15-minute intervals (every 900 seconds remaining)
    const maxFifteenMultiple = Math.floor((initialDuration - 1) / 900) * 900;
    for (let sec = maxFifteenMultiple; sec >= 900; sec -= 900) {
      const mins = Math.floor(sec / 60);
      map.set(sec, {
        seconds: sec,
        label: `${mins} Minutos Restantes`,
        category: '15min',
        soundType: 'interval-15',
      });
    }

    // Also elapsed 15-min marks if duration is non-multiple
    for (let elapsed = 900; elapsed < initialDuration; elapsed += 900) {
      const rem = initialDuration - elapsed;
      if (rem > 600 && !map.has(rem)) {
        map.set(rem, {
          seconds: rem,
          label: `Alerta 15 min (${formatClockLabel(rem)})`,
          category: '15min',
          soundType: 'interval-15',
        });
      }
    }

    // 2. Last 10 minutes (600s)
    if (initialDuration > 600) {
      map.set(600, {
        seconds: 600,
        label: 'Últimos 10 Minutos',
        category: '10min',
        soundType: 'last-10',
      });
    }

    // 3. Last 5 minutes (300s)
    if (initialDuration > 300) {
      map.set(300, {
        seconds: 300,
        label: 'Últimos 5 Minutos',
        category: '5min',
        soundType: 'last-5',
      });
    }

    // 4. Last 1 minute (60s)
    if (initialDuration > 60) {
      map.set(60, {
        seconds: 60,
        label: 'Último 1 Minuto',
        category: '1min',
        soundType: 'last-1',
      });
    }

    return Array.from(map.values()).sort((a, b) => b.seconds - a.seconds);
  }, [initialDuration]);

  const fireAlert = useCallback(
    (
      timeRemainingSec: number,
      label: string,
      subtitle: string,
      type: AlertSoundType
    ) => {
      // Purely sound effects (no voice)
      soundEngine.triggerAlertSound(type, soundMuted);

      const newAlert: TriggeredAlert = {
        id: `${Date.now()}-${timeRemainingSec}`,
        timeRemainingSec,
        label,
        subtitle,
        type,
        triggeredAt: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };

      setActiveBanner(newAlert);
      setAlertHistory((prev) => [newAlert, ...prev.slice(0, 14)]);

      if (bannerTimeoutRef.current) {
        window.clearTimeout(bannerTimeoutRef.current);
      }
      bannerTimeoutRef.current = window.setTimeout(() => {
        setActiveBanner((current) => (current?.id === newAlert.id ? null : current));
      }, 7000);
    },
    [soundMuted]
  );

  // Main countdown interval loop
  useEffect(() => {
    if (!isRunning) return;

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (!firedMarksRef.current.has(0)) {
            firedMarksRef.current.add(0);
            fireAlert(
              0,
              'TEMPO ESGOTADO! MÃOS PARA CIMA!',
              'A prova terminou. Afaste-se da bancada imediatamente!',
              'finish'
            );
          }
          return 0;
        }

        const nextSec = prev - 1;

        // Check if nextSec matches any milestone (15-min intervals, 10m, 5m, 1m)
        if (!firedMarksRef.current.has(nextSec)) {
          const matched = milestones.find((m) => m.seconds === nextSec);
          if (matched) {
            firedMarksRef.current.add(nextSec);
            const subtitleMap = {
              '15min': 'Alerta sonoro periódico de 15 em 15 minutos',
              '10min': 'Alerta sonoro: reta final da prova (10 minutos)!',
              '5min': 'Alerta sonoro: empratamento final (5 minutos)!',
              '1min': 'Alerta sonoro crítico: últimos 60 segundos!',
            };
            fireAlert(
              nextSec,
              matched.label.toUpperCase(),
              subtitleMap[matched.category],
              matched.soundType
            );
          } else if (nextSec <= 10 && nextSec >= 1) {
            // Broadcast studio ticks for final 10 seconds
            soundEngine.triggerAlertSound('final-tick', soundMuted);
          }
        }

        return nextSec;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, milestones, fireAlert, soundMuted]);

  // Primary Action Handlers
  const handlePlayPause = useCallback(() => {
    if (remainingSeconds === 0) {
      const target = initialDuration > 0 ? initialDuration : 60 * 60;
      if (initialDuration === 0) setInitialDuration(target);
      setRemainingSeconds(target);
      firedMarksRef.current.clear();
      setActiveBanner(null);
      setIsRunning(true);
      return;
    }
    setIsRunning((prev) => !prev);
  }, [remainingSeconds, initialDuration]);

  const handleRecomecar = useCallback(() => {
    setIsRunning(false);
    const target = initialDuration > 0 ? initialDuration : 60 * 60;
    setRemainingSeconds(target);
    firedMarksRef.current.clear();
    setActiveBanner(null);
  }, [initialDuration]);

  const handleZerar = useCallback(() => {
    setIsRunning(false);
    setRemainingSeconds(0);
    firedMarksRef.current.clear();
    setActiveBanner(null);
  }, []);

  const handleAdjustRemaining = useCallback((deltaSeconds: number) => {
    setRemainingSeconds((prev) => {
      const next = Math.max(0, prev + deltaSeconds);
      if (next > initialDuration) {
        setInitialDuration(next);
      }
      return next;
    });
  }, [initialDuration]);

  const applyNewTime = (totalSeconds: number) => {
    const clamped = Math.max(10, Math.min(totalSeconds, 12 * 3600));
    setIsRunning(false);
    setInitialDuration(clamped);
    setRemainingSeconds(clamped);
    firedMarksRef.current.clear();
    setActiveBanner(null);

    const h = Math.floor(clamped / 3600);
    const m = Math.floor((clamped % 3600) / 60);
    const s = clamped % 60;
    setCustomHours(h);
    setCustomMinutes(m);
    setCustomSeconds(s);
  };

  const handleCustomTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total =
      Math.max(0, customHours) * 3600 +
      Math.max(0, customMinutes) * 60 +
      Math.max(0, customSeconds);
    if (total > 0) {
      applyNewTime(total);
    }
  };

  // Toggle fullscreen mode with ONLY the clock
  const enterClockOnlyFullscreen = () => {
    setIsClockOnlyFullscreen(true);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const exitClockOnlyFullscreen = () => {
    setIsClockOnlyFullscreen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keyboard controls (Space for Play/Pause, R for Recomeçar, Z for Zerar, F for Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRecomecar();
      } else if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        handleZerar();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (isClockOnlyFullscreen) {
          exitClockOnlyFullscreen();
        } else {
          enterClockOnlyFullscreen();
        }
      } else if (e.key === 'Escape' && isClockOnlyFullscreen) {
        exitClockOnlyFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleRecomecar, handleZerar, isClockOnlyFullscreen]);

  // Sync browser escape key with fullscreen state
  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement && isClockOnlyFullscreen) {
        // user pressed Esc in browser
        setIsClockOnlyFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [isClockOnlyFullscreen]);

  const { hours, minutes, seconds, hasHours } = formatTimeParts(remainingSeconds);

  // Progress calculation for circular MasterChef studio clock ring
  const progressRatio =
    initialDuration > 0 ? Math.min(1, Math.max(0, remainingSeconds / initialDuration)) : 0;
  const circleRadius = 210;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference * (1 - progressRatio);

  const isCriticalMinute = remainingSeconds > 0 && remainingSeconds <= 60;
  const isFinalFive = remainingSeconds > 60 && remainingSeconds <= 300;
  const isFinalTen = remainingSeconds > 300 && remainingSeconds <= 600;

  // =========================================================================
  // VIEW MODE 1: TELA CHEIA SOMENTE COM O RELÓGIO (FULLSCREEN CLOCK ONLY)
  // =========================================================================
  if (isClockOnlyFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black text-orange-500 font-sans flex flex-col items-center justify-between p-4 sm:p-8 select-none overflow-hidden">
        {/* Subtle orange atmosphere glow */}
        <div
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,107,0,0.18),transparent_70%)]"
          aria-hidden="true"
        />

        {/* Top Minimal Bar in Fullscreen: Sound toggle & Exit Fullscreen button */}
        <div className="relative z-20 w-full flex items-center justify-between px-2 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-mono text-orange-400/80">
            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="uppercase tracking-widest font-bold">
              MODO TELÃO · SOMENTE RELÓGIO
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundMuted((m) => !m)}
              className="px-3 py-1.5 rounded-lg border border-orange-500/40 hover:border-orange-500 text-orange-400 bg-black/60 text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer"
              title="Ativar/Desativar som dos alertas"
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{soundMuted ? 'Sem Som' : 'Som Ligado'}</span>
            </button>

            <button
              onClick={exitClockOnlyFullscreen}
              className="px-4 py-1.5 rounded-lg bg-orange-500 text-black hover:bg-amber-400 text-xs font-display font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Sair da Tela Cheia</span>
            </button>
          </div>
        </div>

        {/* Alert Banner Popup in Fullscreen */}
        {activeBanner && (
          <div className="relative z-30 mx-auto w-full max-w-2xl px-4 animate-bounce">
            <div className="bg-black/95 border-2 border-orange-500 rounded-xl p-3 sm:p-4 mc-box-glow flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500 text-black flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
                    Alerta Sonoro Disparado
                  </div>
                  <div className="text-lg sm:text-xl font-display font-bold text-orange-500 mc-text-glow">
                    {activeBanner.label}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveBanner(null)}
                className="p-1 text-orange-400 hover:text-orange-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* CENTERPIECE: HUGE MASTERCHEF CLOCK ONLY */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto w-full max-w-4xl">
          <div className="relative w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] md:w-[620px] md:h-[620px] flex items-center justify-center">
            {/* Huge SVG Dial */}
            <svg
              className="w-full h-full -rotate-90"
              viewBox="0 0 460 460"
              aria-hidden="true"
            >
              {/* Outer decorative ticks */}
              <circle
                cx="230"
                cy="230"
                r="224"
                fill="none"
                stroke="rgba(255, 107, 0, 0.2)"
                strokeWidth="2"
                strokeDasharray="4 10"
              />
              {/* Base track */}
              <circle
                cx="230"
                cy="230"
                r={circleRadius}
                fill="none"
                stroke="rgba(255, 107, 0, 0.16)"
                strokeWidth="14"
              />
              {/* Live Glowing Orange Progress Arc */}
              <circle
                cx="230"
                cy="230"
                r={circleRadius}
                fill="none"
                stroke={isCriticalMinute ? '#FF3B00' : '#FF6B00'}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circleCircumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-[stroke-dashoffset] duration-500 ease-out drop-shadow-[0_0_18px_rgba(255,107,0,0.9)]"
              />
            </svg>

            {/* Content inside the dial: MasterChef Emblem + Enormous Countdown Numbers */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
              <MasterChefLogo
                size="lg"
                showText={true}
                animated={isRunning}
                className="mb-1 sm:mb-2 scale-90 sm:scale-100"
              />

              {/* Giant Digits */}
              <div
                className={`font-mono font-extrabold tabular-nums tracking-tight leading-none ${
                  hasHours
                    ? 'text-6xl sm:text-8xl md:text-9xl'
                    : 'text-7xl sm:text-9xl md:text-[11rem]'
                } ${
                  isCriticalMinute
                    ? 'text-amber-400 mc-text-glow-intense animate-pulse'
                    : 'text-orange-500 mc-text-glow'
                }`}
              >
                {hasHours ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`}
              </div>

              {/* Phase Status */}
              <div className="mt-3 sm:mt-5 text-sm sm:text-base font-mono uppercase tracking-[0.25em] text-orange-400/90 font-bold">
                {remainingSeconds === 0 ? (
                  <span className="text-amber-400 text-lg">MÃOS PARA CIMA!</span>
                ) : isCriticalMinute ? (
                  <span className="text-amber-400">▲ ÚLTIMO MINUTO CRÍTICO ▲</span>
                ) : isFinalFive ? (
                  <span className="text-orange-400">★ ÚLTIMOS 5 MINUTOS — EMPRATAMENTO</span>
                ) : isFinalTen ? (
                  <span className="text-orange-400">⚡ RETA FINAL — ÚLTIMOS 10 MINUTOS</span>
                ) : (
                  <span>
                    {isRunning ? 'PROVA EM ANDAMENTO' : 'CRONÔMETRO PAUSADO'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM MINIMAL CONTROL BAR (PLAY, PAUSE, RECOMEÇAR, ZERAR) */}
        <div className="relative z-20 w-full max-w-xl pb-2">
          <div className="bg-black/80 border border-orange-500/40 rounded-2xl p-2.5 sm:p-3 mc-box-glow flex items-center justify-center gap-2 sm:gap-3">
            <button
              onClick={handlePlayPause}
              className={`flex-1 py-3 px-4 rounded-xl font-display font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                !isRunning
                  ? 'bg-orange-500 text-black hover:bg-amber-400 shadow-[0_0_20px_rgba(255,107,0,0.5)]'
                  : 'bg-amber-500 text-black hover:bg-amber-400'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>{remainingSeconds < initialDuration && remainingSeconds > 0 ? 'Continuar' : 'Play'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleRecomecar}
              className="py-3 px-4 rounded-xl border border-orange-500/60 text-orange-400 hover:bg-orange-500 hover:text-black font-display font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Recomeçar do tempo escolhido"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Recomeçar</span>
            </button>

            <button
              onClick={handleZerar}
              className="py-3 px-4 rounded-xl border border-orange-500/40 text-orange-500 hover:bg-orange-500/20 font-display font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Zerar para 00:00"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Zerar</span>
            </button>

            <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-orange-500/30">
              <button
                onClick={() => handleAdjustRemaining(-60)}
                disabled={remainingSeconds < 60}
                className="px-2 py-2 text-xs font-mono border border-orange-500/40 rounded text-orange-400 hover:bg-orange-500 hover:text-black disabled:opacity-30 cursor-pointer"
                title="Diminuir 1 minuto"
              >
                -1m
              </button>
              <button
                onClick={() => handleAdjustRemaining(60)}
                className="px-2 py-2 text-xs font-mono border border-orange-500/40 rounded text-orange-400 hover:bg-orange-500 hover:text-black cursor-pointer"
                title="Aumentar 1 minuto"
              >
                +1m
              </button>
            </div>
          </div>
          <div className="text-center text-[10px] font-mono text-orange-500/50 mt-1.5">
            Atalhos: Espaço (Play/Pausa) · R (Recomeçar) · Z (Zerar) · Esc (Sair da tela cheia)
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 2: STANDARD DASHBOARD WITH PANELS & FULLSCREEN LAUNCHER
  // =========================================================================
  return (
    <div className="min-h-screen bg-black text-orange-500 font-sans flex flex-col justify-between relative overflow-x-hidden">
      {/* Subtle radial studio spotlight in pure dark orange/black */}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(255,107,0,0.11),transparent_65%)]"
        aria-hidden="true"
      />

      {/* TOP BAR CONTRACT: 3 Zones */}
      <header className="relative z-20 flex items-center justify-between gap-8 px-6 py-4 border-b border-orange-500/25 bg-black/90 backdrop-blur-sm">
        {/* Zone 1: Brand Title */}
        <a
          href="#relogio"
          className="text-xl font-display font-bold tracking-wider text-orange-500 whitespace-nowrap shrink-0 mc-text-glow"
        >
          MASTERCHEF CRONÔMETRO
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-orange-400/80">
          <a
            href="#relogio"
            className="hover:text-orange-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Relógio Oficial
          </a>
          <a
            href="#tempos"
            className="hover:text-orange-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Escolher Tempo
          </a>
          <a
            href="#alertas"
            className="hover:text-orange-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Alertas Sonoros
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action (Tela Cheia Somente Relógio) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={enterClockOnlyFullscreen}
            className="px-4 py-2 text-xs font-display font-bold uppercase tracking-wider text-black bg-orange-500 rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(255,107,0,0.4)]"
            title="Expandir tela cheia com visualização exclusiva do relógio"
          >
            <Tv className="w-4 h-4" />
            <span>Tela Cheia (Somente Relógio)</span>
          </button>
        </div>
      </header>

      {/* ACTIVE ALERT BANNER OVERLAY */}
      {activeBanner && (
        <div className="relative z-30 mx-auto mt-4 w-full max-w-5xl px-6">
          <div className="bg-black border-2 border-orange-500 rounded-xl p-4 sm:p-5 mc-box-glow flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-full bg-orange-500 text-black flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-amber-400">
                  Alerta Sonoro MasterChef · {activeBanner.triggeredAt}
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-bold tracking-wide text-orange-500 mc-text-glow">
                  {activeBanner.label}
                </h2>
                <p className="text-sm text-orange-300/90">{activeBanner.subtitle}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveBanner(null)}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider border border-orange-500/60 text-orange-400 hover:bg-orange-500 hover:text-black rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Fechar Alerta
            </button>
          </div>
        </div>
      )}

      {/* MAIN WORKSPACE */}
      <main className="relative z-10 flex-1 w-full max-w-[1380px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CENTER / LEFT STAGE: GIANT MASTERCHEF STUDIO CLOCK & PRIMARY CONTROLS (7 Cols) */}
        <section
          id="relogio"
          className="lg:col-span-7 flex flex-col items-center justify-center bg-black border border-orange-500/30 rounded-2xl p-6 sm:p-8 mc-box-glow"
        >
          {/* Studio Status Header */}
          <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-orange-500/20 text-xs font-mono text-orange-400/90">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>
                STATUS:{' '}
                <strong className="text-orange-400">
                  {remainingSeconds === 0
                    ? 'TEMPO ESGOTADO'
                    : isRunning
                    ? 'PROVA EM ANDAMENTO'
                    : 'AGUARDANDO / PAUSADO'}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>DURAÇÃO TOTAL: {formatClockLabel(initialDuration)}</span>
            </div>

            {/* Audio Toggle & Clock-only Fullscreen Trigger */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundMuted((m) => !m)}
                className={`px-3 py-1.5 rounded-md border text-xs font-mono flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  !soundMuted
                    ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                    : 'border-orange-500/30 text-orange-500/50 hover:text-orange-400'
                }`}
                title="Ativar ou silenciar alertas sonoros"
              >
                {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{soundMuted ? 'Som Mudo' : 'Som Ativo'}</span>
              </button>

              <button
                onClick={enterClockOnlyFullscreen}
                className="px-3 py-1.5 rounded-md border border-orange-500/50 text-orange-400 hover:bg-orange-500 hover:text-black text-xs font-mono flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Abrir tela cheia focada apenas no relógio"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Somente Relógio</span>
              </button>
            </div>
          </div>

          {/* MASTERCHEF CIRCULAR STUDIO DIAL + LOGO + GIANT ORANGE COUNTDOWN */}
          <div className="relative flex flex-col items-center justify-center my-2 w-full">
            <div className="relative w-[310px] h-[310px] sm:w-[440px] sm:h-[440px] flex items-center justify-center">
              {/* SVG Circular Studio Dial */}
              <svg
                className="w-full h-full -rotate-90"
                viewBox="0 0 460 460"
                aria-hidden="true"
              >
                {/* Outer decorative tick ring */}
                <circle
                  cx="230"
                  cy="230"
                  r="222"
                  fill="none"
                  stroke="rgba(255, 107, 0, 0.18)"
                  strokeWidth="2"
                  strokeDasharray="4 10"
                />
                {/* Track ring */}
                <circle
                  cx="230"
                  cy="230"
                  r={circleRadius}
                  fill="none"
                  stroke="rgba(255, 107, 0, 0.14)"
                  strokeWidth="12"
                />
                {/* Dynamic orange countdown arc */}
                <circle
                  cx="230"
                  cy="230"
                  r={circleRadius}
                  fill="none"
                  stroke={isCriticalMinute ? '#FF3B00' : '#FF6B00'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-[stroke-dashoffset] duration-500 ease-out drop-shadow-[0_0_12px_rgba(255,107,0,0.8)]"
                />
              </svg>

              {/* Center of the Clock: MasterChef Logo + Giant Tabular Orange Digits */}
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                <MasterChefLogo
                  size="md"
                  showText={true}
                  animated={isRunning}
                  className="mb-2 sm:mb-3"
                />

                {/* Giant Countdown Readout */}
                <div
                  className={`font-mono font-extrabold tabular-nums tracking-tight leading-none select-none ${
                    hasHours
                      ? 'text-5xl sm:text-7xl'
                      : 'text-6xl sm:text-8xl'
                  } ${
                    isCriticalMinute
                      ? 'text-amber-400 mc-text-glow-intense animate-pulse'
                      : 'text-orange-500 mc-text-glow'
                  }`}
                >
                  {hasHours ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`}
                </div>

                {/* Phase Label underneath digits */}
                <div className="mt-3 text-xs sm:text-sm font-mono uppercase tracking-[0.2em] text-orange-400/90">
                  {remainingSeconds === 0 ? (
                    <span className="text-amber-400 font-bold">MÃOS PARA CIMA!</span>
                  ) : isCriticalMinute ? (
                    <span className="text-amber-400 font-bold">▲ ÚLTIMO MINUTO CRÍTICO ▲</span>
                  ) : isFinalFive ? (
                    <span className="text-orange-400 font-semibold">★ ÚLTIMOS 5 MINUTOS — EMPRATAMENTO</span>
                  ) : isFinalTen ? (
                    <span className="text-orange-400">⚡ RETA FINAL — ÚLTIMOS 10 MINUTOS</span>
                  ) : (
                    <span>ALERTAS SONOROS: 15/15 MIN · 10M · 5M · 1M</span>
                  )}
                </div>

                {/* Live +/- 1 Minute Quick Stepper */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustRemaining(-60)}
                    disabled={remainingSeconds < 60}
                    className="px-2.5 py-1 text-xs font-mono border border-orange-500/40 rounded text-orange-400 hover:bg-orange-500 hover:text-black disabled:opacity-30 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    -1 min
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustRemaining(60)}
                    className="px-2.5 py-1 text-xs font-mono border border-orange-500/40 rounded text-orange-400 hover:bg-orange-500 hover:text-black transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    +1 min
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4 PRIMARY CONTROLS: PLAY, PAUSAR, RECOMEÇAR, ZERAR */}
          <div className="w-full mt-4 pt-5 border-t border-orange-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Play Button */}
            <button
              type="button"
              onClick={handlePlayPause}
              disabled={isRunning}
              className={`py-3.5 px-4 rounded-xl font-display font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                !isRunning
                  ? 'bg-orange-500 text-black hover:bg-amber-400 shadow-[0_0_25px_rgba(255,107,0,0.5)]'
                  : 'bg-orange-950/30 border border-orange-500/30 text-orange-500/40 cursor-not-allowed'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{remainingSeconds < initialDuration && remainingSeconds > 0 ? 'Continuar' : 'Play'}</span>
            </button>

            {/* Pause Button */}
            <button
              type="button"
              onClick={() => setIsRunning(false)}
              disabled={!isRunning}
              className={`py-3.5 px-4 rounded-xl font-display font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                isRunning
                  ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)]'
                  : 'bg-orange-950/30 border border-orange-500/30 text-orange-500/40 cursor-not-allowed'
              }`}
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>Pausar</span>
            </button>

            {/* Recomeçar */}
            <button
              type="button"
              onClick={handleRecomecar}
              className="py-3.5 px-4 rounded-xl font-display font-bold uppercase tracking-wider text-sm border border-orange-500/60 text-orange-400 hover:bg-orange-500 hover:text-black flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Recomeçar</span>
            </button>

            {/* Zerar */}
            <button
              type="button"
              onClick={handleZerar}
              className="py-3.5 px-4 rounded-xl font-display font-bold uppercase tracking-wider text-sm border border-orange-500/40 text-orange-500/80 hover:border-orange-500 hover:bg-orange-500/20 hover:text-orange-300 flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Zerar</span>
            </button>
          </div>
        </section>

        {/* RIGHT COLUMN: ESCOLHER TEMPO REGRESSIVO & PAINEL DE ALERTAS (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* PANEL 1: ESCOLHER O TEMPO REGRESSIVO */}
          <section
            id="tempos"
            className="bg-black border border-orange-500/30 rounded-2xl p-6 mc-box-glow"
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-display font-bold uppercase tracking-wider text-orange-500">
                  Escolher Tempo Regressivo
                </h2>
              </div>
              <span className="text-xs font-mono text-orange-400/70">Provas MasterChef</span>
            </div>

            {/* Preset Challenge Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
              {PRESET_PROVAS.map((preset) => {
                const isSelected = initialDuration === preset.seconds;
                return (
                  <button
                    key={preset.seconds}
                    type="button"
                    onClick={() => applyNewTime(preset.seconds)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-orange-500 text-black border-orange-400 font-bold shadow-[0_0_15px_rgba(255,107,0,0.4)]'
                        : 'bg-black border-orange-500/35 text-orange-400 hover:border-orange-500 hover:bg-orange-500/10'
                    }`}
                  >
                    <div className="font-mono text-base font-bold leading-tight whitespace-nowrap">
                      {preset.label}
                    </div>
                    <div
                      className={`text-[11px] mt-0.5 truncate ${
                        isSelected ? 'text-black/80 font-medium' : 'text-orange-400/70'
                      }`}
                    >
                      {preset.sub}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Time Picker Form */}
            <form
              onSubmit={handleCustomTimeSubmit}
              className="pt-4 border-t border-orange-500/20"
            >
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-orange-400/90 mb-3">
                <Sliders className="w-3.5 h-3.5" />
                <span>Tempo Personalizado (Horas : Minutos : Segundos)</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label
                    htmlFor="input-hours"
                    className="block text-[11px] font-mono uppercase text-orange-400/70 mb-1"
                  >
                    Horas (HH)
                  </label>
                  <input
                    id="input-hours"
                    type="number"
                    min={0}
                    max={12}
                    value={customHours}
                    onChange={(e) => setCustomHours(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-black border border-orange-500/50 focus:border-orange-400 rounded-lg px-3 py-2 font-mono text-lg font-bold text-orange-500 text-center outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="input-minutes"
                    className="block text-[11px] font-mono uppercase text-orange-400/70 mb-1"
                  >
                    Minutos (MM)
                  </label>
                  <input
                    id="input-minutes"
                    type="number"
                    min={0}
                    max={59}
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-black border border-orange-500/50 focus:border-orange-400 rounded-lg px-3 py-2 font-mono text-lg font-bold text-orange-500 text-center outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="input-seconds"
                    className="block text-[11px] font-mono uppercase text-orange-400/70 mb-1"
                  >
                    Segundos (SS)
                  </label>
                  <input
                    id="input-seconds"
                    type="number"
                    min={0}
                    max={59}
                    value={customSeconds}
                    onChange={(e) => setCustomSeconds(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-black border border-orange-500/50 focus:border-orange-400 rounded-lg px-3 py-2 font-mono text-lg font-bold text-orange-500 text-center outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-black border border-orange-500 rounded-xl font-display font-bold uppercase tracking-wider text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Definir Tempo Personalizado
              </button>
            </form>
          </section>

          {/* PANEL 2: ALERTAS SOMENTE SONOROS */}
          <section
            id="alertas"
            className="bg-black border border-orange-500/30 rounded-2xl p-6 mc-box-glow"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-display font-bold uppercase tracking-wider text-orange-500">
                  Alertas Sonoros da Prova
                </h2>
              </div>
              <span className="text-xs font-mono text-orange-400/80">
                15/15m · 10m · 5m · 1m
              </span>
            </div>

            <p className="text-xs text-orange-300/80 mb-4 leading-relaxed">
              O cronômetro emite alertas exclusivamente sonoros a cada{' '}
              <strong className="text-orange-400">15 minutos</strong> e nos{' '}
              <strong className="text-orange-400">últimos 10, 5 e 1 minuto</strong>. Clique em{' '}
              <em>Testar</em> para ouvir o sinal sonoro ou em <em>Ir</em> para simular o momento.
            </p>

            {/* Quick Sound Check Bar for the 4 Required Alert Types */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <button
                type="button"
                onClick={() =>
                  fireAlert(
                    900,
                    'ALERTA DE 15 MINUTOS!',
                    'Sinal sonoro de 15 em 15 minutos',
                    'interval-15'
                  )
                }
                className="px-2.5 py-2 rounded-lg border border-orange-500/40 hover:bg-orange-500 hover:text-black text-orange-400 text-xs font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                🔊 Som 15m
              </button>
              <button
                type="button"
                onClick={() =>
                  fireAlert(
                    600,
                    'ÚLTIMOS 10 MINUTOS!',
                    'Sinal sonoro de reta final (10 minutos)',
                    'last-10'
                  )
                }
                className="px-2.5 py-2 rounded-lg border border-orange-500/40 hover:bg-orange-500 hover:text-black text-orange-400 text-xs font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                🔊 Som 10m
              </button>
              <button
                type="button"
                onClick={() =>
                  fireAlert(
                    300,
                    'ÚLTIMOS 5 MINUTOS!',
                    'Sinal sonoro de empratamento (5 minutos)',
                    'last-5'
                  )
                }
                className="px-2.5 py-2 rounded-lg border border-orange-500/40 hover:bg-orange-500 hover:text-black text-orange-400 text-xs font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                🔊 Som 5m
              </button>
              <button
                type="button"
                onClick={() =>
                  fireAlert(
                    60,
                    'ÚLTIMO 1 MINUTO!',
                    'Sinal sonoro de contagem crítica (1 minuto)',
                    'last-1'
                  )
                }
                className="px-2.5 py-2 rounded-lg border border-orange-500/40 hover:bg-orange-500 hover:text-black text-orange-400 text-xs font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                🔊 Som 1m
              </button>
            </div>

            {/* Programmed Checkpoints List for Current Duration */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {milestones.length === 0 ? (
                <div className="text-xs font-mono text-orange-400/60 py-4 text-center border border-dashed border-orange-500/20 rounded-lg">
                  Escolha um tempo maior que 1 minuto para visualizar os marcos programados.
                </div>
              ) : (
                milestones.map((m) => {
                  const hasPassed = remainingSeconds <= m.seconds;
                  return (
                    <div
                      key={m.seconds}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-mono transition-colors ${
                        hasPassed
                          ? 'border-orange-500/20 bg-orange-950/10 text-orange-500/50'
                          : 'border-orange-500/40 bg-orange-500/5 text-orange-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {hasPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-orange-500/50 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                        )}
                        <span className="font-bold tabular-nums">{formatClockLabel(m.seconds)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{m.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            // Jump to 3 seconds before milestone to hear the sound alert trigger
                            const previewStart = Math.min(initialDuration, m.seconds + 3);
                            setRemainingSeconds(previewStart);
                            firedMarksRef.current.delete(m.seconds);
                            setIsRunning(true);
                          }}
                          className="px-2 py-0.5 rounded border border-orange-500/40 hover:bg-orange-500 hover:text-black text-[11px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          title="Simular chegada a este alerta (faltando 3s)"
                        >
                          Ir ({formatClockLabel(m.seconds + 3)})
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Triggered Alerts History */}
            {alertHistory.length > 0 && (
              <div className="mt-4 pt-3 border-t border-orange-500/20">
                <div className="text-[11px] font-mono uppercase tracking-wider text-orange-400/70 mb-2">
                  Últimos Alertas Disparados
                </div>
                <div className="space-y-1 text-xs font-mono text-orange-300/80">
                  {alertHistory.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span className="truncate">{item.label}</span>
                      <span className="text-orange-500/60 tabular-nums">{item.triggeredAt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-orange-500/20 px-6 py-4 text-center text-xs font-mono text-orange-500/60">
        MasterChef Cronômetro de Cozinha · Alertas exclusivamente sonoros a cada 15 min e nos últimos 10, 5 e 1 minuto
      </footer>
    </div>
  );
}
