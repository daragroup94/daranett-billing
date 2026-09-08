export interface RateLimitOptions {
  interval?: number;
  uniqueTokenPerInterval?: number;
}

export default function rateLimit({ interval = 60 * 1000, uniqueTokenPerInterval = 500 }: RateLimitOptions = {}) {
  const tokenCounts = new Map<string, number>();

  // Periodically clean up old entries
  const cleanup = setInterval(() => {
    tokenCounts.clear();
  }, interval);

  // Prevent the timer from keeping the process alive
  if (cleanup.unref) {
    cleanup.unref();
  }

  return {
    check(limit: number, token: string): Promise<void> {
      return new Promise((resolve, reject) => {
        const currentCount = tokenCounts.get(token) || 0;

        if (tokenCounts.size >= uniqueTokenPerInterval && !tokenCounts.has(token)) {
          return reject(new Error('Rate limit exceeded: terlalu banyak pengguna unik'));
        }

        if (currentCount >= limit) {
          return reject(new Error('Rate limit exceeded: terlalu banyak permintaan'));
        }

        tokenCounts.set(token, currentCount + 1);
        resolve();
      });
    },
  };
}
