/** Run async work for one key at a time. A later call waits for the earlier one. */
export function createKeyLock() {
  const tails = new Map<string, Promise<void>>();
  return function exclusive<T>(
    key: string,
    task: () => Promise<T>,
  ): Promise<T> {
    const previous = tails.get(key) ?? Promise.resolve();
    const run = previous.then(task, task);
    const settled = run.then(
      () => undefined,
      () => undefined,
    );
    tails.set(key, settled);
    void settled.finally(() => {
      if (tails.get(key) === settled) tails.delete(key);
    });
    return run;
  };
}
