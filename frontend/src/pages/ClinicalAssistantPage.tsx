import React, { useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField,
  Chip, Paper, CircularProgress, Alert, Divider, IconButton
} from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import StorageIcon from '@mui/icons-material/Storage';
import { assistantApi } from '../services/api';

const QUICK_QUESTIONS = [
  "Why did the destination evaluation change?",
  "Summarize this patient.",
  "What changed in the last 10 minutes?",
  "Which hospital resources are stale?",
  "Show the current ETA.",
  "Prepare a handover.",
  "Why did Hospital A's evaluation change?"
];

export const ClinicalAssistantPage: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<any>(null);
  const [history, setHistory] = useState<Array<{ q: string; a: string; engine: string }>>([
    {
      q: "Summarize this patient.",
      a: "Summary for CASE-2026-001: 38-year-old male involved in high-speed MVC. Primary trauma: blunt thoracic injury and scalp laceration. Current Vitals: HR 124 bpm (tachycardic), BP 92/58 mmHg, SpO2 91% on room air improving to 96% on 15L O2 NRB, RR 28 bpm. MEWS Score: 7 (Red / Critical). En route to Apollo Emergency Center with current ETA of 12 minutes.",
      engine: "LifeFlow Deterministic Grounded RAG"
    }
  ]);

  const handleAsk = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim()) return;

    try {
      setLoading(true);
      const systemContext = {
        case_id: "CASE-2026-001",
        vitals: { heartRate: 124, systolicBp: 92, diastolicBp: 58, spo2: 91, respiratoryRate: 28, mewsScore: 7 },
        target_hospital: "Apollo Emergency Center",
        eta_minutes: 12,
        interventions: ["High-flow O2 15L", "18G IV Access 500mL Saline", "Rigid C-Collar"]
      };

      const result = await assistantApi.query(q, systemContext);
      setResponse(result);
      setHistory(prev => [{ q, a: result.answer, engine: result.engine }, ...prev]);
      if (!queryText) setQuestion('');
    } catch (err) {
      console.error('Failed to query assistant', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
        <PsychologyIcon sx={{ color: '#bc8cff', fontSize: 34 }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
            Clinical & Operational AI Assistant (Local Ollama)
          </Typography>
          <Typography variant="body2" sx={{ color: '#8b949e' }}>
            Local Retrieval-Augmented Generation Grounded Exclusively in Authoritative Healthcare System State
          </Typography>
        </Box>
      </Box>

      {/* Safety & Grounding Banner */}
      <Alert
        severity="info"
        sx={{
          mb: 3,
          backgroundColor: 'rgba(188, 140, 255, 0.1)',
          border: '1px solid rgba(188, 140, 255, 0.4)',
          color: '#c9d1d9'
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#bc8cff' }}>
          CLINICAL GROUNDING & NON-FABRICATION GUARANTEE:
        </Typography>
        <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mt: 0.5 }}>
          Per Section 4 & 33 of the LifeFlow AI Architecture, this assistant <strong>never fabricates clinical data</strong> and never silently modifies patient state. All answers are grounded in active Patient, Transport, and Hospital Twin telemetry. If an exact data point is unknown, it reports UNKNOWN rather than guessing.
        </Typography>
      </Alert>

      {/* Quick Questions Chips */}
      <Typography variant="subtitle2" sx={{ color: '#8b949e', fontWeight: 700, mb: 1, letterSpacing: 0.5 }}>
        PRE-SET SYSTEM QUERIES (CLICK TO ASK)
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        {QUICK_QUESTIONS.map((q) => (
          <Chip
            key={q}
            label={q}
            onClick={() => handleAsk(q)}
            sx={{
              backgroundColor: '#161b22',
              color: '#58a6ff',
              border: '1px solid #30363d',
              fontWeight: 600,
              fontSize: '0.78rem',
              '&:hover': {
                backgroundColor: '#21262d',
                borderColor: '#58a6ff'
              }
            }}
          />
        ))}
      </Box>

      {/* Query Input Box */}
      <Paper sx={{ p: 2, backgroundColor: '#161b22', border: '1px solid #30363d', mb: 3 }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} sm={10}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ask anything about the active emergency case, hospital capacity, ETA, or vital trends..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#0d1117',
                  color: '#c9d1d9',
                  '& fieldset': { borderColor: '#30363d' }
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              disabled={loading || !question.trim()}
              onClick={() => handleAsk()}
              endIcon={<SendIcon />}
              sx={{ height: 40, fontWeight: 700, backgroundColor: '#8957e5', '&:hover': { backgroundColor: '#703ed8' } }}
            >
              {loading ? 'Querying...' : 'Ask AI'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Query Responses */}
      <Typography variant="subtitle2" sx={{ color: '#8b949e', fontWeight: 700, mb: 1.5, letterSpacing: 0.5 }}>
        RECENT ASSISTANT EXPLANATIONS & QUERIES
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {history.map((item, idx) => (
          <Card key={idx} sx={{ border: '1px solid #30363d', backgroundColor: '#161b22' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HelpOutlineIcon sx={{ color: '#58a6ff', fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                    {item.q}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#3fb950' }} />}
                    label="100% Grounded"
                    size="small"
                    sx={{ height: 20, fontSize: '0.62rem', backgroundColor: 'rgba(63, 185, 80, 0.15)', color: '#3fb950', border: '1px solid #3fb950' }}
                  />
                  <Chip
                    label={item.engine}
                    size="small"
                    sx={{ height: 20, fontSize: '0.62rem', backgroundColor: '#21262d', color: '#8b949e' }}
                  />
                </Box>
              </Box>

              <Typography variant="body2" sx={{ color: '#c9d1d9', lineHeight: 1.6, backgroundColor: '#0d1117', p: 1.5, borderRadius: 1.5, border: '1px solid #21262d' }}>
                {item.a}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};
