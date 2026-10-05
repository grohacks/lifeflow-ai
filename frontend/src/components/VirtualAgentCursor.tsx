import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';

export interface VirtualCursorState {
  x: number;
  y: number;
  visible: boolean;
  label: string;
  sublabel?: string;
  isClicking: boolean;
  rippleCoords?: { x: number; y: number } | null;
  transitionDuration?: number; // milliseconds for smooth gliding
}

export const playTactileClick = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(350, audioCtx.currentTime + 0.035);
    gain.gain.setValueAtTime(0.28, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.035);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.035);
  } catch (e) {}
};

export const playCelebrationChime = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.1);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.1 + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + idx * 0.1);
      osc.stop(audioCtx.currentTime + idx * 0.1 + 0.35);
    });
  } catch (e) {}
};

export const speakAgentVoice = (text: string) => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech error:', e);
    }
  }
};

interface VirtualAgentCursorProps {
  cursorState: VirtualCursorState;
}

export const VirtualAgentCursor: React.FC<VirtualAgentCursorProps> = ({ cursorState }) => {
  const { x, y, visible, label, sublabel, isClicking, rippleCoords, transitionDuration = 700 } = cursorState;

  if (!visible) return null;

  const durationSec = (transitionDuration / 1000).toFixed(2);

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 999999,
        overflow: 'hidden'
      }}
    >
      {/* Click Hologram Ripple Animation */}
      {rippleCoords && (
        <Box
          key={`${rippleCoords.x}-${rippleCoords.y}-${Date.now()}`}
          sx={{
            position: 'absolute',
            left: rippleCoords.x,
            top: rippleCoords.y,
            width: 10,
            height: 10,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            border: '2px solid #3fb950',
            boxShadow: '0 0 20px #3fb950, inset 0 0 12px #3fb950',
            animation: 'copilotClickRipple 0.55s ease-out forwards',
            '@keyframes copilotClickRipple': {
              '0%': {
                width: 10,
                height: 10,
                opacity: 1,
                borderWidth: '3px'
              },
              '50%': {
                opacity: 0.85,
                borderWidth: '2px'
              },
              '100%': {
                width: 80,
                height: 80,
                opacity: 0,
                borderWidth: '1px'
              }
            }
          }}
        />
      )}

      {/* Trailing Soft Glow Particle */}
      <Box
        sx={{
          position: 'absolute',
          left: x,
          top: y,
          width: 26,
          height: 26,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(63, 185, 80, 0.3)',
          filter: 'blur(10px)',
          transition: `left ${durationSec}s cubic-bezier(0.22, 1, 0.36, 1), top ${durationSec}s cubic-bezier(0.22, 1, 0.36, 1)`,
          pointerEvents: 'none'
        }}
      />

      {/* Main Virtual Pointer Body with Smooth Interpolation */}
      <Box
        sx={{
          position: 'absolute',
          left: x,
          top: y,
          transform: `translate(-2px, -2px) ${isClicking ? 'scale(0.85) translate(2px, 2px)' : 'scale(1)'}`,
          transition: isClicking
            ? 'transform 0.08s ease-in'
            : `left ${durationSec}s cubic-bezier(0.22, 1, 0.36, 1), top ${durationSec}s cubic-bezier(0.22, 1, 0.36, 1), transform 0.15s ease-out`,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.2
        }}
      >
        {/* Cyber Neon Arrow Pointer SVG */}
        <Box sx={{ position: 'relative', width: 28, height: 28, flexShrink: 0 }}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              filter: isClicking
                ? 'drop-shadow(0 0 12px #3fb950) drop-shadow(0 0 4px #58a6ff)'
                : 'drop-shadow(0 0 8px rgba(63, 185, 80, 0.8)) drop-shadow(0 2px 5px rgba(0,0,0,0.8))'
            }}
          >
            {/* Outer border / glow path */}
            <path
              d="M3 2L11.5 24L15.5 15.5L24 11.5L3 2Z"
              fill="url(#agentGradient)"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Inner accent core */}
            <path
              d="M6 5.5L12 20.5L14.8 14.5L20.8 12L6 5.5Z"
              fill="#238636"
              opacity="0.85"
            />
            {/* Center target dot */}
            <circle cx="3" cy="2" r="2" fill="#58a6ff" />

            <defs>
              <linearGradient id="agentGradient" x1="3" y1="2" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3fb950" />
                <stop offset="0.6" stopColor="#2ea043" />
                <stop offset="1" stopColor="#58a6ff" />
              </linearGradient>
            </defs>
          </svg>
        </Box>

        {/* Floating Agent Status Badge Pill */}
        <Box
          sx={{
            display: 'inline-flex',
            flexDirection: 'column',
            backgroundColor: 'rgba(13, 17, 23, 0.94)',
            border: isClicking ? '1.5px solid #3fb950' : '1.5px solid rgba(88, 166, 255, 0.5)',
            boxShadow: isClicking
              ? '0 0 20px rgba(63, 185, 80, 0.6), 0 8px 24px rgba(0,0,0,0.7)'
              : '0 0 14px rgba(88, 166, 255, 0.3), 0 6px 18px rgba(0,0,0,0.6)',
            borderRadius: 2,
            px: 1.2,
            py: 0.4,
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(8px)',
            transform: 'translateY(12px)',
            transition: 'all 0.18s ease'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            {/* Pulsing Beacon Dot */}
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: isClicking ? '#3fb950' : '#58a6ff',
                boxShadow: isClicking ? '0 0 8px #3fb950' : '0 0 6px #58a6ff',
                animation: 'beaconPulse 1.2s infinite alternate',
                '@keyframes beaconPulse': {
                  '0%': { transform: 'scale(0.8)', opacity: 0.6 },
                  '100%': { transform: 'scale(1.2)', opacity: 1 }
                }
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                fontSize: '0.72rem',
                color: '#f0f6fc',
                letterSpacing: '0.4px',
                lineHeight: 1.2
              }}
            >
              {label || '🤖 Paramedic AI Agent'}
            </Typography>
          </Box>

          {sublabel && (
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.64rem',
                fontWeight: 600,
                color: isClicking ? '#7ee787' : '#8b949e',
                lineHeight: 1.1,
                mt: 0.2
              }}
            >
              {isClicking ? '🖱️ CLICKING...' : sublabel}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};
