export interface PlaybackSave {
  position: number;
  duration: number | null;
}

export interface PlaybackSaveQueue {
  push: (input: PlaybackSave) => void;
  flush: () => Promise<void>;
  peek: () => PlaybackSave | null;
}

export function createPlaybackSaveQueue(
  save: (input: PlaybackSave) => Promise<unknown>,
): PlaybackSaveQueue {
  let pending: PlaybackSave | null = null;
  let running: Promise<void> | null = null;

  async function run(): Promise<void> {
    while (pending) {
      const next = pending;
      pending = null;
      await save(next).catch(() => undefined);
    }
  }

  function process(): Promise<void> {
    if (running) {
      return running;
    }
    running = run().finally(() => {
      running = null;
    });
    return running;
  }

  return {
    push(input) {
      pending = input;
      void process();
    },
    flush() {
      return process();
    },
    peek() {
      return pending;
    },
  };
}