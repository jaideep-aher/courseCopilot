import { useState, useEffect } from 'react';
import { getStatistics } from '../api/client';

export default function useStatistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStatistics()
      .then(setStats)
      .catch(e => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error };
}
