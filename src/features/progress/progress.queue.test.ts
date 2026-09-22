import { describe, expect, it } from "vitest";
import { createPlaybackSaveQueue } from "./progress.queue";

function deferred() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve: () => resolve() };
}

describe("createPlaybackSaveQueue", () => {
  it("persists queued positions in order", async () => {
    const saved: number[] = [];
    const queue = createPlaybackSaveQueue(async (input) => {
      saved.push(input.position);
    });

    queue.push({ position: 30, duration: 600 });
    queue.push({ position: 60, duration: 600 });
    await queue.flush();

    expect(saved).toEqual([30, 60]);
  });

  it("never runs two saves concurrently", async () => {
    let active = 0;
    let peak = 0;
    const queue = createPlaybackSaveQueue(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
    });

    queue.push({ position: 10, duration: 600 });
    queue.push({ position: 20, duration: 600 });
    queue.push({ position: 30, duration: 600 });
    await queue.flush();

    expect(peak).toBe(1);
  });

  it("favors the latest position when updates arrive rapidly", async () => {
    const saved: number[] = [];
    const gate = deferred();
    let first = true;

    const queue = createPlaybackSaveQueue(async (input) => {
      saved.push(input.position);
      if (first) {
        first = false;
        await gate.promise;
      }
    });

    queue.push({ position: 10, duration: 600 });
    queue.push({ position: 20, duration: 600 });
    queue.push({ position: 30, duration: 600 });
    gate.resolve();
    await queue.flush();

    expect(saved).toEqual([10, 30]);
    expect(queue.peek()).toBeNull();
  });

  it("keeps saving after a failed save", async () => {
    const saved: number[] = [];
    const queue = createPlaybackSaveQueue(async (input) => {
      if (input.position === 10) {
        throw new Error("save failed");
      }
      saved.push(input.position);
    });

    queue.push({ position: 10, duration: 600 });
    queue.push({ position: 20, duration: 600 });
    await queue.flush();

    expect(saved).toEqual([20]);
  });
});