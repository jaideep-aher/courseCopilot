import axios from 'axios';

// Production split deploy: set VITE_API_URL to the API origin. Dev uses Vite /api proxy.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

// General
export const getHealth = () => api.get('/health').then((r) => r.data);
export const getStatistics = () => api.get('/statistics').then((r) => r.data);

// Courses
export const getCourses = (university) =>
  api.get('/courses', { params: university ? { university } : {} }).then((r) => r.data);
export const getSourceCourses = () => api.get('/courses/source').then((r) => r.data);
export const getTargetCourses = () => api.get('/courses/target').then((r) => r.data);
export const getCourseById = (id) =>
  api.get(`/courses/${encodeURIComponent(id)}`).then((r) => r.data);

// Matching
export const matchSingle = (sourceId, targetUniversity = 'Duke') =>
  api
    .post('/match/single', {
      source_course_id: sourceId,
      target_university: targetUniversity,
    })
    .then((r) => r.data);

export const matchCustom = (syllabusData) =>
  api.post('/match/custom', syllabusData).then((r) => r.data);

export const matchBatch = (sourceIds, targetUniversity = 'Duke') =>
  api
    .post('/match/batch', {
      source_course_ids: sourceIds,
      target_university: targetUniversity,
    })
    .then((r) => r.data);

// Transcript evaluation
export const evaluateTranscript = (file, targetUniversity = 'Duke') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('target_university', targetUniversity);
  return api.post('/pipeline/transcript-evaluate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
  }).then((r) => r.data);
};

export { API_BASE };
export default api;
