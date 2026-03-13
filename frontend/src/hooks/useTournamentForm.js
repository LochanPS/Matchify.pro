import { useState, useEffect, useCallback } from 'react';

const DRAFT_STORAGE_KEY = 'matchify_tournament_drafts';

// Get all drafts from localStorage
export const getTournamentDrafts = () => {
  try {
    const drafts = localStorage.getItem(DRAFT_STORAGE_KEY);
    return drafts ? JSON.parse(drafts) : [];
  } catch {
    return [];
  }
};

// Save a draft
export const saveTournamentDraft = (draft) => {
  try {
    const drafts = getTournamentDrafts();
    const existingIndex = drafts.findIndex(d => d.id === draft.id);
    
    if (existingIndex >= 0) {
      drafts[existingIndex] = { ...draft, updatedAt: new Date().toISOString() };
    } else {
      drafts.push({ ...draft, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    return true;
  } catch {
    return false;
  }
};

// Delete a draft
export const deleteTournamentDraft = (draftId) => {
  try {
    const drafts = getTournamentDrafts();
    const filtered = drafts.filter(d => d.id !== draftId);
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
};

// Generate unique draft ID
const generateDraftId = () => {
  return 'draft_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

export const useTournamentForm = (existingDraftId = null) => {
  const [draftId, setDraftId] = useState(existingDraftId || generateDraftId());
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    description: '',
    type: 'OPEN',
    format: 'both',
    privacy: 'public',
    city: '',
    state: '',
    zone: '',
    country: 'India',
    venue: '',
    address: '',
    pincode: '',
    shuttleType: '',
    shuttleBrand: '',
    
    // Step 2: Dates
    registrationOpenDate: '',
    registrationCloseDate: '',
    startDate: '',
    endDate: '',
    
    // Step 3: Posters
    posters: [],
    
    // Step 4: Categories
    categories: [],
    
    // Step 5: Payment QR
    paymentQR: null,
    upiId: '',
    accountHolderName: '',
    
    // Step 6: Courts & Timing
    totalCourts: 1,
    matchStartTime: '08:00',
    matchEndTime: '18:00',
    matchDuration: 45,
  });

  // Load existing draft on mount
  useEffect(() => {
    if (existingDraftId) {
      const drafts = getTournamentDrafts();
      const draft = drafts.find(d => d.id === existingDraftId);
      if (draft) {
        setFormData(draft.formData);
        setCurrentStep(draft.currentStep || 1);
        setCompletedSteps(draft.completedSteps || []);
        setDraftId(draft.id);
      }
    }
  }, [existingDraftId]);

  // Auto-save draft when form data changes (debounced)
  const saveDraft = useCallback(() => {
    // Only save if there's meaningful data
    if (formData.name || formData.description || formData.venue) {
      const draft = {
        id: draftId,
        formData: {
          ...formData,
          // Don't save file objects, only previews for display
          posters: formData.posters.map(p => ({ preview: p.preview, isPrimary: p.isPrimary })),
          paymentQR: formData.paymentQR ? { preview: formData.paymentQR.preview } : null,
        },
        currentStep,
        completedSteps,
      };
      saveTournamentDraft(draft);
    }
  }, [draftId, formData, currentStep, completedSteps]);

  // Save draft on changes (with debounce effect)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft();
    }, 1000); // Save after 1 second of no changes

    return () => clearTimeout(timer);
  }, [saveDraft]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateMultipleFields = (fields) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const nextStep = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    setCurrentStep(prev => Math.min(prev + 1, 6));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step) => {
    setCurrentStep(step);
  };

  const markStepComplete = (step) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps(prev => [...prev, step]);
    }
  };

  const clearDraft = () => {
    deleteTournamentDraft(draftId);
  };

  return {
    draftId,
    currentStep,
    completedSteps,
    formData,
    updateFormData,
    updateMultipleFields,
    nextStep,
    prevStep,
    goToStep,
    markStepComplete,
    saveDraft,
    clearDraft,
  };
};
