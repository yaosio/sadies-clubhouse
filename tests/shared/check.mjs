// What every activity's headless tests (tests/<activity>/run.mjs) start and end with: `check(name, ok,
// detail)` prints a PASS or FAIL line and counts the failures, `finish()` says how many and exits with
// the right code. A change here runs every activity's tests again.
//   const { check, finish } = checker();  ...checks...  finish();
// (`finish(failed, passed)`: the words for each outcome, for a run whose output another reads)
export function checker() {
  let failed = 0;
  return {
    check(name, ok, detail) {
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
      if (!ok) failed++;
    },
    finish(bad = 'FAILED', good = 'all passed') {
      console.log(failed ? `\n${failed} ${bad}` : `\n${good}`);
      process.exit(failed ? 1 : 0);
    },
  };
}
