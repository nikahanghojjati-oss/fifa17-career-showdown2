export type LaneState = 'pass' | 'fail' | 'running' | 'queued' | 'skipped'

export type Lane = { name: string; state: LaneState }

export type Report = {
  at: string
  state: 'ALL_CLEAR' | 'BARKING' | 'STUCK'
  barking: string | null
  gate: { pr: number | null; head: string; lanes: Lane[]; seal: string } | null
  pos20: { pr: number | null; passed: number; total: number; state: string } | null
}

export type Reading = { report: Report | null; fetchedAt: number; error: string | null }

declare module 'claude-code' {
  interface PluginState {
    physio: { reading: Reading; isHidden: boolean }
  }
}
