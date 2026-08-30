import { test } from "node:test";
import assert from "node:assert/strict";
import { opendirWithRetry } from "../src/scan.js";

function makeError(code) {
  const err = new Error(code);
  err.code = code;
  return err;
}

test("opendirWithRetry succeeds immediately when there is no error", async () => {
  let calls = 0;
  const open = async () => {
    calls += 1;
    return "handle";
  };
  const result = await opendirWithRetry("/some/dir", { open, delayMs: 1 });
  assert.equal(result, "handle");
  assert.equal(calls, 1);
});

test("opendirWithRetry retries on transient error codes and eventually succeeds", async () => {
  let calls = 0;
  const open = async () => {
    calls += 1;
    if (calls < 3) throw makeError("EBUSY");
    return "handle";
  };
  const result = await opendirWithRetry("/some/dir", { open, delayMs: 1, retries: 4 });
  assert.equal(result, "handle");
  assert.equal(calls, 3);
});

test("opendirWithRetry gives up after exhausting retries on a persistent transient error", async () => {
  let calls = 0;
  const open = async () => {
    calls += 1;
    throw makeError("EBUSY");
  };
  await assert.rejects(
    () => opendirWithRetry("/some/dir", { open, delayMs: 1, retries: 2 }),
    (err) => err.code === "EBUSY",
  );
  assert.equal(calls, 3); // initial attempt + 2 retries
});

test("opendirWithRetry does not retry non-transient errors like ENOENT", async () => {
  let calls = 0;
  const open = async () => {
    calls += 1;
    throw makeError("ENOENT");
  };
  await assert.rejects(
    () => opendirWithRetry("/some/dir", { open, delayMs: 1, retries: 4 }),
    (err) => err.code === "ENOENT",
  );
  assert.equal(calls, 1); // no retries for a stable, non-transient error
});
