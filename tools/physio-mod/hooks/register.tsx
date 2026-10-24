import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Lane, LaneState, Reading, Report } from '../types'

// Written by the "Showdown Gate Physio" workflow (schema physio/v1) on the
// factory branch of the public repo, so no token is needed to read it.
export const STATUS_URL =
  'https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/factory/gameplay-v1/project-documents/gameplay-factory/physio-status.json'

const POLL_MS = 60_000
const STALE_MS = 15 * 60_000

const reading = atom({ plugin: 'physio', key: 'reading' } as const, {
  report: null,
  fetchedAt: 0,
  error: null,
} as Reading)
const isHidden = atom({ plugin: 'physio', key: 'isHidden' } as const, false)

const LANE_STATES: LaneState[] = ['pass', 'fail', 'running', 'queued', 'skipped']

function asLane(value: unknown): Lane | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  const state = LANE_STATES.includes(v.state as LaneState) ? (v.state as LaneState) : 'queued'
  return typeof v.name === 'string' ? { name: v.name, state } : null
}

// Reads a physio/v1 file; anything it does not recognise becomes null rather than a guess.
export function parseReport(text: string): Report | null {
  let raw: Record<string, any>
  try {
    raw = JSON.parse(text)
  } catch {
    return null
  }
  if (raw?.schema !== 'physio/v1' || typeof raw.at !== 'string') return null

  const state = ['ALL_CLEAR', 'BARKING', 'STUCK'].includes(raw.state) ? raw.state : 'STUCK'
  const waiting = Array.isArray(raw.checks) ? raw.checks.find((c: any) => c && c.action) : null
  const barking = waiting
    ? `${waiting.workflow ?? 'a check'}${waiting.pr ? ` on #${waiting.pr}` : ''} waited ${
        waiting.queued_minutes ?? '?'
      } min for a machine, ${waiting.action} (${waiting.attempt ?? 0}/${waiting.max_attempts ?? 2})`
    : null

  const g = raw.gate
  const gate =
    g && Array.isArray(g.lanes)
      ? {
          pr: typeof g.pr === 'number' ? g.pr : null,
          head: String(g.head_sha ?? '').slice(0, 7),
          lanes: g.lanes.map(asLane).filter((l: Lane | null): l is Lane => l !== null),
          seal: typeof g.seal === 'string' ? g.seal : 'PENDING',
        }
      : null

  const p = raw.pos20
  const pos20 =
    p && typeof p.total === 'number'
      ? {
          pr: typeof p.pr === 'number' ? p.pr : null,
          passed: Number(p.passed) || 0,
          total: p.total,
          state: String(p.state ?? ''),
        }
      : null

  return { at: raw.at, state, barking, gate, pos20 }
}

const LANE_MARK: Record<LaneState, string> = {
  pass: '✓',
  fail: '✗',
  running: '…',
  queued: '·',
  skipped: '–',
}

const LANE_COLOR: Record<LaneState, string> = {
  pass: 'green',
  fail: 'red',
  running: 'yellow',
  queued: 'gray',
  skipped: 'gray',
}

export function sealColor(seal: string): string {
  if (seal === 'PASS') return 'green'
  if (seal === 'FAIL_TEST' || seal === 'INFRA_EXHAUSTED') return 'red'
  if (seal === 'INFRA_RETRYING' || seal === 'PENDING') return 'yellow'
  return 'gray'
}

// The one-line text for the status line; the band draws the same facts in colour.
export function summary(r: Reading, now: number): string {
  const report = r.report
  if (!report) return r.error ? `🩺 Physio: can't reach GitHub (${r.error})` : '🩺 Physio: checking…'
  const age = now - Date.parse(report.at)
  if (age > STALE_MS) return `🩺 Physio: no fresh report (${Math.round(age / 60_000)} min old)`

  const physio =
    report.state === 'ALL_CLEAR'
      ? '🩺 All clear'
      : report.state === 'BARKING'
        ? `🐕 Barking: ${report.barking ?? 'a check is waiting for a machine'}`
        : `🔴 Stuck: ${report.barking ?? 'GitHub gave no machine after 2 re-queues'}`

  const gate = report.gate
    ? ` │ Gate${report.gate.pr ? ` #${report.gate.pr}` : ''} ${report.gate.lanes
        .map(l => `${l.name.split(' ')[0]}${LANE_MARK[l.state]}`)
        .join(' ')} seal ${report.gate.seal}`
    : ''
  const pos20 = report.pos20 ? ` │ POS20 ${report.pos20.passed}/${report.pos20.total}` : ''
  return `${physio}${gate}${pos20}`
}

export const register: Register = on => {
  let poll: { cancel: () => void } | null = null

  on('session.start', async ($, e, next) => {
    const refresh = async () => {
      const now = await $.clock.now()
      try {
        // The minute stamp keeps the raw CDN from serving a copy older than one poll.
        const res = await $.http.fetch(`${STATUS_URL}?t=${Math.floor(now / POLL_MS)}`)
        const report = res.ok ? parseReport(res.text) : null
        await update($, reading, prev => ({
          report: report ?? prev.report,
          fetchedAt: now,
          error: res.ok ? (report ? null : 'unreadable report') : `HTTP ${res.status}`,
        }))
      } catch {
        await update($, reading, prev => ({ ...prev, fetchedAt: now, error: 'offline' }))
      }
      $.ui.status(summary(await read($, reading), now))
    }

    poll?.cancel()
    poll = $.clock.every(POLL_MS, () => void refresh())
    void refresh()

    $.command.register({ name: 'physio', description: 'Show or hide the Physio and Showdown Gate bar' })
    return next(e)
  })

  on('command.run', { command: 'physio' }, async $ => {
    const hidden = await update($, isHidden, h => !h)
    return { text: hidden ? 'Physio bar hidden. Type /physio to show it.' : 'Physio bar shown.' }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const r = await read($, reading)
    if (e.props.hasSurvey || (await read($, isHidden)) || !r.report) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const report = r.report
    const stale = (await $.clock.now()) - Date.parse(report.at) > STALE_MS
    const physioColor = stale
      ? 'gray'
      : report.state === 'ALL_CLEAR'
        ? 'green'
        : report.state === 'BARKING'
          ? 'yellow'
          : 'red'
    const physioText = stale
      ? 'Physio: no fresh report'
      : report.state === 'ALL_CLEAR'
        ? '🩺 Physio: all clear'
        : report.state === 'BARKING'
          ? `🐕 Physio: ${report.barking ?? 'barking'}`
          : `🔴 Physio: ${report.barking ?? 'stuck'}`

    return (
      <Box flexDirection="row" flexWrap="wrap" gap={1}>
        <Text color={physioColor} bold>
          {physioText}
        </Text>
        {report.gate ? (
          <Box flexDirection="row" gap={1}>
            <Text dimColor>│ Showdown Gate{report.gate.pr ? ` #${report.gate.pr}` : ''}</Text>
            {report.gate.lanes.map(l => (
              <Text key={l.name} color={LANE_COLOR[l.state]}>
                {`${l.name.split(' ')[0]}${LANE_MARK[l.state]}`}
              </Text>
            ))}
            <Text color={sealColor(report.gate.seal)} bold>
              {`seal ${report.gate.seal}`}
            </Text>
          </Box>
        ) : null}
        {report.pos20 ? (
          <Text dimColor>{`│ POS20 ${report.pos20.passed}/${report.pos20.total}`}</Text>
        ) : null}
      </Box>
    )
  })
}
