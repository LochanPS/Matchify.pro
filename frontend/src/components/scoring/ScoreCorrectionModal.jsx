import { getErrorMessage } from '../../utils/errorMessage';
import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../utils/api';

const ScoreCorrectionModal = ({ matchId, currentScore, onClose, onSuccess }) => {
  const [correctionType, setCorrectionType] = useState('set_score');
  const [details, setDetails] = useState('');
  const [proposedScore, setProposedScore] = useState(JSON.stringify(currentScore, null, 2));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successModal, setSuccessModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let parsedScore;
      try {
        parsedScore = JSON.parse(proposedScore);
      } catch (err) {
        setError('Invalid JSON format in proposed score');
        setSubmitting(false);
        return;
      }

      const response = await api.post(
        `/matches/${matchId}/corrections`,
        { correctionType, details, proposedScore: parsedScore }
      );

      if (response.data.success) {
        setSuccessModal(true);
      }
    } catch (err) {
      console.error('Error submitting correction:', err);
      setError(getErrorMessage(err, 'Failed to submit correction request'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModal(false);
    if (onSuccess) onSuccess();
    onClose();
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '10px 14px',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 8
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: 16
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #0C1220, #0A0F1A)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 18,
        padding: 24,
        width: '100%',
        maxWidth: 560,
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <AlertTriangle style={{ width: 18, height: 18, color: '#F87171' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>Score Correction</h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Request admin review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Warning */}
        <div style={{
          background: 'rgba(245,158,11,0.07)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 10, padding: '10px 14px',
          marginBottom: 20
        }}>
          <p style={{ fontSize: 13, color: 'rgba(252,211,77,0.8)', margin: 0, lineHeight: 1.5 }}>
            This request will be sent to an admin for approval. Match continues with current score until approved.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10, padding: '10px 14px',
            marginBottom: 16
          }}>
            <p style={{ fontSize: 13, color: '#F87171', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Correction Type */}
          <div>
            <label style={labelStyle}>Correction Type</label>
            <select
              value={correctionType}
              onChange={(e) => setCorrectionType(e.target.value)}
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              required
              onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
              <option value="set_score" style={{ background: '#0C1220' }}>Set Score Error</option>
              <option value="match_score" style={{ background: '#0C1220' }}>Match Score Error</option>
              <option value="undo_multiple" style={{ background: '#0C1220' }}>Undo Multiple Points</option>
              <option value="other" style={{ background: '#0C1220' }}>Other</option>
            </select>
          </div>

          {/* Details */}
          <div>
            <label style={labelStyle}>Details <span style={{ color: 'rgba(239,68,68,0.7)' }}>*</span></label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80, fontFamily: 'inherit', lineHeight: 1.5 }}
              rows={4}
              placeholder="Example: Accidentally awarded 3 points to wrong player. Should be 19-17, not 22-17."
              required
              onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
              Be specific about what went wrong and what the correct score should be.
            </p>
          </div>

          {/* Proposed Score */}
          <div>
            <label style={labelStyle}>Proposed Score (JSON) <span style={{ color: 'rgba(239,68,68,0.7)' }}>*</span></label>
            <textarea
              value={proposedScore}
              onChange={(e) => setProposedScore(e.target.value)}
              style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12, resize: 'vertical', minHeight: 160, lineHeight: 1.6 }}
              rows={12}
              required
              onFocus={e => e.target.style.borderColor = 'rgba(6,182,212,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
              Edit the JSON to reflect the correct score. Must be valid JSON.
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                flex: 1, padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)',
                borderRadius: 12, fontSize: 14, fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.5 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1, padding: '12px 16px',
                background: submitting ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg, #EF4444, #DC2626)',
                border: 'none',
                color: '#fff',
                borderRadius: 12, fontSize: 14, fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                boxShadow: submitting ? 'none' : '0 4px 16px rgba(239,68,68,0.3)'
              }}
            >
              {submitting ? 'Submitting…' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {successModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #0C1220, #0A0F1A)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 18,
            padding: 32,
            maxWidth: 380, width: '100%',
            textAlign: 'center',
            boxShadow: '0 0 40px rgba(16,185,129,0.15)'
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 0 24px rgba(16,185,129,0.2)'
            }}>
              <CheckCircle style={{ width: 32, height: 32, color: '#34D399' }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#34D399', marginBottom: 8 }}>Request Submitted!</h3>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Correction request submitted. Admin will review it shortly.
            </p>
            <button
              onClick={handleSuccessClose}
              style={{
                width: '100%', padding: '13px 16px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                border: 'none', borderRadius: 12,
                color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(16,185,129,0.3)'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreCorrectionModal;
