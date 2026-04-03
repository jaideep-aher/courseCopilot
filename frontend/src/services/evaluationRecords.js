/**
 * Persist evaluation runs for students; staff reads when cloud storage is configured.
 * Falls back to localStorage when the cloud client is not configured (demo / dev).
 */
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const LS_PREFIX = 'cc_evaluations:'

/** Cloud rows expect real user UUIDs. Demo hardcoded ids use localStorage only. */
function isUuid(id) {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

function lsKey(userId) {
  return `${LS_PREFIX}${userId}`
}

function readLocal(userId) {
  try {
    const raw = localStorage.getItem(lsKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocal(userId, rows) {
  localStorage.setItem(lsKey(userId), JSON.stringify(rows))
}

/**
 * @param {string} userId - app user id (hardcoded session or cloud auth id)
 * @param {object} params
 * @param {string} params.targetUniversity
 * @param {object} params.result - full API result (stored as JSON)
 */
export async function saveStudentEvaluation(userId, { targetUniversity, result }) {
  const summary = result?.summary
    ? `Evaluated ${result.summary?.total_evaluated ?? 0} course(s)`
    : 'Evaluation complete'
  const courses = result?.courses_parsed ?? result?.summary?.total_evaluated ?? 0

  const row = {
    id: crypto.randomUUID(),
    student_id: userId,
    target_university: targetUniversity,
    status: 'faculty_review',
    result_json: result,
    summary,
    courses_evaluated: typeof courses === 'number' ? courses : 0,
    created_at: new Date().toISOString(),
  }

  if (isSupabaseConfigured && supabase && isUuid(userId)) {
    const { data, error } = await supabase
      .from('evaluations')
      .insert({
        student_id: userId,
        target_university: targetUniversity,
        status: 'faculty_review',
        result_json: result,
        summary,
        courses_evaluated: row.courses_evaluated,
      })
      .select('id, created_at')
      .single()

    if (error) throw error
    row.id = data.id
    row.created_at = data.created_at
    return row
  }

  const prev = readLocal(userId)
  writeLocal(userId, [row, ...prev])
  return row
}

export async function listEvaluationsForStudent(userId) {
  if (isSupabaseConfigured && supabase && isUuid(userId)) {
    const { data, error } = await supabase
      .from('evaluations')
      .select('id, target_university, status, summary, courses_evaluated, created_at')
      .eq('student_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  }
  return readLocal(userId)
}

export async function listEvaluationsForUniversity() {
  if (!isSupabaseConfigured || !supabase) return []
  const { data, error } = await supabase
    .from('evaluations')
    .select('id, student_id, target_university, status, summary, courses_evaluated, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function listPendingFacultyReviews() {
  if (!isSupabaseConfigured || !supabase) return []
  const { data, error } = await supabase
    .from('evaluations')
    .select('id, student_id, target_university, status, summary, result_json, created_at')
    .in('status', ['faculty_review', 'model_complete'])
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function setFacultyDecision(evaluationId, professorId, decision, notes = '') {
  if (!isSupabaseConfigured || !supabase || !isUuid(professorId)) {
    throw new Error('Cloud storage and a signed-in faculty account are required for decisions.')
  }

  const decidedAt = new Date().toISOString()
  const { error: revErr } = await supabase.from('faculty_reviews').upsert(
    {
      evaluation_id: evaluationId,
      professor_id: professorId,
      decision,
      notes,
      decided_at: decidedAt,
    },
    { onConflict: 'evaluation_id,professor_id' }
  )
  if (revErr) throw revErr

  const nextStatus = decision === 'approved' ? 'approved' : 'rejected'
  const { error: evErr } = await supabase
    .from('evaluations')
    .update({ status: nextStatus, updated_at: decidedAt })
    .eq('id', evaluationId)
  if (evErr) throw evErr
}

export async function upsertStudentDeadline(studentId, dueAtIso, setByUserId, notes) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Cloud storage is required to set deadlines.')
  }
  const { error } = await supabase.from('student_deadlines').upsert(
    {
      student_id: studentId,
      due_at: dueAtIso,
      set_by: isUuid(setByUserId) ? setByUserId : null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'student_id' }
  )
  if (error) throw error
}

export async function getStudentDeadline(studentId) {
  if (!isSupabaseConfigured || !supabase || !isUuid(studentId)) return null
  const { data, error } = await supabase
    .from('student_deadlines')
    .select('due_at, notes')
    .eq('student_id', studentId)
    .maybeSingle()
  if (error) throw error
  return data
}
