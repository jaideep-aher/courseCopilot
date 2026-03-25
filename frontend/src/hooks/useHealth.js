import { useState, useEffect } from 'react';
import { getHealth } from '../api/client';

export default function useHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(e => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false));
  }, []);

  return { health, loading, error };
}
