import { useState, useEffect } from 'react';
import { getCourses } from '../api/client';

export default function useCourses(university) {
  const [data, setData] = useState({ courses: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getCourses(university || undefined)
      .then(setData)
      .catch(e => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false));
  }, [university]);

  return { courses: data.courses, total: data.total, loading, error };
}
