export const model = "RB-2";
const text = value => typeof value === "string" && value.trim() ? value.trim() : "unknown";

export function buildRecoveryBeacon({ repository, branch, pr, head, lane, failureClass, rootHypothesis, lastSafeCheckpoint, nextAction, updatedAt = new Date().toISOString() }) {
  const payload = {
    model,
    updatedAt,
    repository: text(repository),
    branch: text(branch),
    pr: pr ?? "unknown",
    recordedHead: text(head),
    lane: text(lane),
    failureClass: text(failureClass),
    rootHypothesis: text(rootHypothesis),
    lastSafeCheckpoint: text(lastSafeCheckpoint),
    nextAction: text(nextAction),
    orientationOnly: true
  };
  return `<!-- POS5_RB2\n${JSON.stringify(payload)}\nPOS5_RB2 -->`;
}

export function upsertRecoveryBeacon(body, beacon) {
  const source = String(body || "");
  const pattern = /<!-- POS5_RB2\n[\s\S]*?\nPOS5_RB2 -->/;
  return pattern.test(source) ? source.replace(pattern, beacon) : `${source.trim()}\n\n${beacon}\n`;
}
