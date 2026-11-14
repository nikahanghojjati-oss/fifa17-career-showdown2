import { describe, expect, mock, test } from 'claude-code/testing'

import { parseReport, summary } from '../hooks/register'

const AT = '2026-10-05T22:40:00Z'
const NOW = Date.parse(AT) + 60_000

const sample = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    schema: 'physio/v1',
    at: AT,
    state: 'ALL_CLEAR',
    checks: [],
    helpers_paused: [],
    gate: {
      pr: 385,
      head_sha: 'abcdef1234567',
      lanes: [
        { name: 'L1 core', state: 'pass' },
        { name: 'L2 browser-full', state: 'running' },
        { name: 'L3 storage', state: 'queued' },
        { name: 'L4 remote', state: 'pass' },
        { name: 'L5 rules', state: 'fail' },
        { name: 'L6 journey', state: 'pass' },
      ],
      seal: 'PENDING',
    },
    pos20: { pr: 385, passed: 14, total: 16, state: 'running' },
    ...over,
  })

describe('physio report', () => {
  test('reads the Physio, every gate lane and the seal', async () => {
    const r = parseReport(sample())
    expect(r?.gate?.lanes.length).toBe(6)
    expect(r?.gate?.head).toBe('abcdef1')
    const line = summary({ report: r, fetchedAt: NOW, error: null }, NOW)
    expect(line).toBe('🩺 All clear │ Gate #385 L1✓ L2… L3· L4✓ L5✗ L6✓ seal PENDING │ POS20 14/16')
  })

  test('barks with the waiting check and its re-queue count', async () => {
    const r = parseReport(
      sample({
        state: 'BARKING',
        checks: [{ workflow: 'Showdown Gate', pr: 385, queued_minutes: 12, action: 're-queued', attempt: 1, max_attempts: 2 }],
      }),
    )
    expect(summary({ report: r, fetchedAt: NOW, error: null }, NOW)).toContain(
      '🐕 Barking: Showdown Gate on #385 waited 12 min for a machine, re-queued (1/2)',
    )
  })

  test('says so when the report is stale, unreadable or out of reach', async () => {
    const r = parseReport(sample())
    expect(summary({ report: r, fetchedAt: NOW, error: null }, NOW + 20 * 60_000)).toContain('no fresh report')
    expect(parseReport('not json')).toBe(null)
    expect(parseReport(JSON.stringify({ schema: 'other', at: AT }))).toBe(null)
    expect(summary({ report: null, fetchedAt: NOW, error: 'HTTP 404' }, NOW)).toContain("can't reach GitHub (HTTP 404)")
  })

  test('draws the bar on terminal and desktop from the fetched report', async ($, on) => {
    on('http.fetch', () => ({ value: { status: 200, ok: true, headers: {}, text: sample() } }))
    const clock = mock.clock(on, { now: NOW })
    const lines: (string | undefined)[] = []
    on('ui.status', (_, e) => {
      lines.push(e.text)
      return { value: undefined }
    })
    on('command.register', () => ({ value: { command: 'physio' } }))
    on('session.start', () => ({ cwd: '/tmp' }))
    await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
    await clock.advance(1)
    expect(lines.at(-1)).toContain('🩺 All clear │ Gate #385')
    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({
        plugin: 'physio',
        surface,
        component: 'AbovePrompt',
        props: { hasSurvey: false, isWorking: false, maxRows: 10, width: 120 } as any,
      })
      expect(await ui.find({ type: 'Text', text: /Physio: all clear/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /seal PENDING/ })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: /L5✗/ })).toBeDefined()
      await ui.unmount()
    }
  })
})
