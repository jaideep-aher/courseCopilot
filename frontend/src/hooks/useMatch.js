import { useState } from 'react';
import { matchSingle, matchCustom, matchBatch } from '../api/client';

export default function useMatch() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reset = () => {
    setResult(null);
    setError(null);
  };

  const runMatchSingle = async (sourceId, targetUniversity) => {
    setLoading(true);
    setError(null);
    try {
      const data = await matchSingle(sourceId, targetUniversity);
      setResult(data);
      return data;
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  const runMatchCustom = async (syllabusData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await matchCustom(syllabusData);
      setResult(data);
      return data;
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  const runMatchBatch = async (sourceIds, targetUniversity) => {
    setLoading(true);
    setError(null);
    try {
      const data = await matchBatch(sourceIds, targetUniversity);
      setResult(data);
      return data;
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, reset, runMatchSingle, runMatchCustom, runMatchBatch };
}
