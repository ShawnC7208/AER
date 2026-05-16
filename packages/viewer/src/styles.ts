export const styles = String.raw`
:root {
  --bg: #fbfaf6;
  --panel: #ffffff;
  --ink: #1a1a1a;
  --ink-2: #555;
  --ink-3: #8a8780;
  --line: #ece9df;
  --line-2: #f3f1e9;
  --hover: #f7f5ee;
  --attn: #b86b00;
  --attn-bg: #fdf2dc;
  --attn-line: #ecd5a3;
  --ok: #2d6a4a;
  --ok-bg: #e6f0e9;
  --danger: #a23636;
  --danger-bg: #f8e6e6;
  --code: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
}
* { box-sizing: border-box; }
html, body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
button, input { font: inherit; }
.topbar {
  padding: 16px 32px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--line);
  background: var(--bg);
}
.logo { font-weight: 600; letter-spacing: -0.01em; }
.logo .dot { color: var(--attn); margin-right: 4px; }
.crumb { color: var(--ink-3); font-size: 13px; }
.spacer { flex: 1; }
.runid { font-family: var(--code); font-size: 12px; color: var(--ink-3); }
.container { max-width: 1080px; margin: 0 auto; padding: 36px 32px 96px; }
.hero { margin-bottom: 32px; }
.eyebrow {
  font-size: 12px;
  color: var(--ink-3);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.eyebrow .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ok); }
h1 {
  margin: 0 0 14px;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.25;
}
.goal { font-size: 15px; color: var(--ink-2); max-width: 720px; margin: 0 0 24px; }
.notice {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--attn);
  padding: 10px 14px;
  background: var(--attn-bg);
  border-left: 2px solid var(--attn);
  border-radius: 2px;
  margin-bottom: 28px;
}
.notice.ok { color: var(--ok); background: var(--ok-bg); border-left-color: var(--ok); }
.notice b { font-weight: 600; }
.notice .sep { color: var(--attn-line); margin: 0 4px; }
.metrics {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  padding: 18px 0;
  margin-bottom: 40px;
}
.metric { padding: 0 4px; }
.metric:not(:last-child) { border-right: 1px solid var(--line-2); }
.metric .label {
  font-size: 11px;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}
.metric .value { font-size: 22px; font-weight: 600; letter-spacing: -0.01em; }
.metric .value.attn { color: var(--attn); }
.metric .value.ok { color: var(--ok); }
.section { margin-bottom: 40px; }
.section > header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 10px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--line);
}
.section h2 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-2);
}
.count { font-size: 12px; color: var(--ink-3); }
.phase {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 20px;
  padding: 16px 0;
}
.phase + .phase, .file-row + .file-row, .verify-row + .verify-row, .claim + .claim, .mut + .mut {
  border-top: 1px solid var(--line-2);
}
.phase .meta { color: var(--ink-3); font-size: 12px; }
.phase .num {
  display: block;
  font-weight: 600;
  color: var(--ink-2);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.time, .dur, .ref, .hash { font-family: var(--code); font-size: 11px; color: var(--ink-3); }
.phase .name { font-weight: 600; font-size: 15px; margin-bottom: 4px; }
.why { color: var(--ink-3); font-size: 13px; margin-bottom: 10px; }
.actions { display: flex; flex-wrap: wrap; gap: 6px 8px; align-items: center; }
.action { font-family: var(--code); font-size: 11.5px; color: var(--ink-2); padding: 2px 0; }
.action + .action::before { content: "·"; color: var(--ink-3); margin-right: 8px; margin-left: -2px; }
.action.attn {
  background: var(--attn-bg);
  color: var(--attn);
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 3px;
}
.action.fail { color: var(--attn); }
.action .ix { color: var(--ink-3); margin-left: 4px; font-size: 10.5px; }
details.group { display: inline; }
details.group > summary {
  list-style: none;
  cursor: pointer;
  display: inline;
  font-family: var(--code);
  font-size: 11.5px;
  color: var(--ink-2);
  border-bottom: 1px dashed var(--ink-3);
}
details.group > summary:hover { color: var(--ink); border-bottom-color: var(--ink); }
details.group[open] > summary { color: var(--ink); }
details.group .group-list {
  display: block;
  margin-top: 8px;
  padding-left: 12px;
  border-left: 1px solid var(--line);
}
details.group .group-list .action { display: block; padding: 2px 0; }
details.group .group-list .action + .action::before { display: none; }
.file-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto;
  gap: 14px;
  align-items: center;
  padding: 12px 0;
}
.path {
  font-family: var(--code);
  font-size: 13px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.badge {
  font-family: var(--code);
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.badge.new { background: var(--ok-bg); color: var(--ok); }
.badge.mod, .badge.edit, .badge.write, .badge.external, .badge.bash-mutating {
  background: var(--attn);
  color: white;
}
.badge.deleted, .badge.delete { background: var(--danger); color: white; }
.stats { font-family: var(--code); font-size: 12px; color: var(--ink-3); }
.stats .add { color: var(--ok); }
.stats .rem { color: var(--danger); }
.verify-row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  font-size: 13px;
}
.verify-row .icon { font-family: var(--code); font-size: 14px; text-align: center; }
.verify-row.ok .icon { color: var(--ok); }
.verify-row.fail .icon { color: var(--attn); }
.detail { color: var(--ink-3); font-size: 12px; }
.mut { padding: 18px 0; }
.mut-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
.mut-head .path { flex: 1; min-width: 220px; }
.mut-meta { display: flex; flex-wrap: wrap; gap: 4px 18px; font-size: 12px; color: var(--ink-2); margin-bottom: 12px; }
.mut-meta span { white-space: nowrap; }
.mut-meta .k { color: var(--ink-3); margin-right: 4px; }
.mut-meta .v { font-family: var(--code); font-size: 11.5px; }
details > summary { cursor: pointer; list-style: none; color: var(--ink-3); }
details > summary::-webkit-details-marker { display: none; }
details.diff-wrap > summary .arrow, details.raw > summary .arrow {
  transition: transform .15s;
  display: inline-block;
}
details.diff-wrap[open] > summary .arrow, details.raw[open] > summary .arrow {
  transform: rotate(90deg);
}
.diff {
  margin-top: 10px;
  background: #fcfaf3;
  border: 1px solid var(--line);
  border-radius: 4px;
  font-family: var(--code);
  font-size: 12px;
  padding: 12px 14px;
  white-space: pre;
  overflow-x: auto;
  line-height: 1.6;
}
.diff .add { background: var(--ok-bg); color: #1f5b3a; display: block; }
.diff .rem { background: var(--danger-bg); color: var(--danger); display: block; }
.diff .ctx { color: var(--ink-3); display: block; }
.diff .skip { color: var(--ink-3); display: block; font-style: italic; }
.diff .word { background: rgba(255, 204, 0, 0.32); border-radius: 2px; }
.claim { padding: 12px 0; }
.claim .flags { color: var(--attn); font-size: 12px; margin-top: 4px; }
.raw {
  margin-top: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}
.raw > summary {
  font-size: 12px;
  color: var(--ink-3);
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}
.raw > summary:hover { color: var(--ink-2); }
.raw-table {
  margin-top: 14px;
  font-family: var(--code);
  font-size: 11.5px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--panel);
}
.raw-row {
  display: grid;
  grid-template-columns: 48px 72px 90px minmax(0, 1fr);
  gap: 8px;
  padding: 5px 12px;
}
.raw-row + .raw-row { border-top: 1px solid var(--line-2); }
.raw-row:hover { background: var(--hover); }
.raw-row.attn { background: var(--attn-bg); }
.raw-row .ix, .raw-row .ts, .raw-row .kind { color: var(--ink-3); }
.raw-row .body {
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.raw-row.attn .body { color: var(--attn); font-weight: 600; }
.raw-block {
  margin-top: 12px;
  background: #fcfaf3;
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 12px 14px;
  overflow-x: visible;
  font-family: var(--code);
  font-size: 12px;
}
.footer { color: var(--ink-3); font-size: 11.5px; margin-top: 48px; padding-top: 20px; border-top: 1px solid var(--line); }
@media (max-width: 760px) {
  .topbar { padding: 14px 18px; }
  .container { padding: 28px 18px 72px; }
  .metrics { grid-template-columns: repeat(2, 1fr); gap: 16px 0; }
  .metric:nth-child(2n) { border-right: 0; }
  .phase { grid-template-columns: 1fr; gap: 8px; }
  .file-row, .verify-row, .raw-row { grid-template-columns: 1fr; align-items: start; }
  .raw-row .body { white-space: normal; }
}
`;
