import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const TournamentCancellationPage = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  
  const [tournament, setTournament] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const [formData, setFormData] = useState({
    cancellationReason