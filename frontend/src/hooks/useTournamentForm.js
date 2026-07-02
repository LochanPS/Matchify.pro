import { useState, useEffect, useCallback } from 'react';
import safeStorage from '../utils/safeStorage';

const DRAFT_STORAGE_KEY = 'matchify_tournament_drafts';

// Get all drafts from localStorage
export const getTournamentDrafts = () => {
  try {
    const drafts = safeStorage.getItem(DRAFT_STORAGE_KEY);
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

    safeStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
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
    safeStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
};

// Get most recently updated draft (for auto-resume)
export const getMostRecentDraft = () => {
  try {
    const drafts = getTournamentDrafts();
    if (!drafts.length) return null;
    return drafts.sort((a, b) =>
      new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
    )[0];
  } catch {
    return null;
  }
};

// Generate unique draft ID
const generateDraftId = () => {
  return 'draft_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

export const useTournamentForm = (existingDraftId = null) => {
  const [draftId, setDraftId] = useState(() => existingDraftId || generateDraftId());
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [draftResumed, setDraftResumed] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    description: '',
    type: 'OPEN',
    sport: 'Badminton',
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
    contactPhone: '',
    whatsappNumber: '',
    
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

  // Load draft on mount — explicit ID takes priority, then auto-resume most recent
  useEffect(() => {
    const idToLoad = existingDraftId;
    let draft = null;

    if (idToLoad) {
      const drafts = getTournamentDrafts();
      draft = drafts.find(d => d.id === idToLoad);
    } else {
      // Auto-resume most recent draft if no ID in URL
      draft = getMostRecentDraft();
    }

    if (draft) {
      setFormData(prev => ({ ...prev, ...draft.formData }));
      setCurrentStep(draft.currentStep || 1);
      setCompletedSteps(draft.completedSteps || []);
      setDraftId(draft.id);
      setDraftResumed(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft when form data changes (debounced)
  const saveDraft = useCallback(() => {
    // Only save if there's meaningful data
    if (formData.name || formData.description || formData.venue) {
      const draft = {
        id: draftId,
        formData: {
          ...formData,
          // Blob URLs expire on page reload — strip files/previews entirely.
          // User will need to re-upload on resume (all other fields are preserved).
          posters: [],
          paymentQR: null,
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
    setCurrentStep(prev => Math.min(prev + 1, 7));
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
    draftResumed,
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
