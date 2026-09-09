import type { ExpireOption, Redis } from "@upstash/redis";

type RedisValue = string | Record<string, unknown>;
type QueuedCommand = () => Promise<unknown>;

export class InMemoryRedis {
  private readonly values = new Map<string, RedisValue>();
  private readonly expiresAt = new Map<string, number>();

  private removeIfExpired(key: string): void {
    const expiresAt = this.expiresAt.get(key);
    if (expiresAt !== undefined && expiresAt <= Date.now()) {
      this.values.delete(key);
      this.expiresAt.delete(key);
    }
  }

  async exists(key: string): Promise<number> {
    this.removeIfExpired(key);
    return this.values.has(key) ? 1 : 0;
  }

  async get<T>(key: string): Promise<T | null> {
    this.removeIfExpired(key);
    const value = this.values.get(key);
    return typeof value === "string" ? (value as T) : null;
  }

  async set(
    key: string,
    value: string,
    options?: { ex?: number },
  ): Promise<"OK"> {
    this.values.set(key, value);
    if (options?.ex === undefined) this.expiresAt.delete(key);
    else this.expiresAt.set(key, Date.now() + options.ex * 1_000);
    return "OK";
  }

  async hgetall<T>(key: string): Promise<T | null> {
    this.removeIfExpired(key);
    const value = this.values.get(key);
    return value && typeof value === "object"
      ? (structuredClone(value) as T)
      : null;
  }

  async hset(key: string, fields: Record<string, unknown>): Promise<number> {
    this.removeIfExpired(key);
    const current = this.values.get(key);
    const hash = current && typeof current === "object" ? current : {};
    let created = 0;
    for (const [field, value] of Object.entries(fields)) {
      if (!(field in hash)) created += 1;
      hash[field] = value;
    }
    this.values.set(key, hash);
    return created;
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    this.removeIfExpired(key);
    const value = this.values.get(key);
    if (!value || typeof value !== "object") return 0;
    let deleted = 0;
    for (const field of fields) {
      if (field in value) {
        delete value[field];
        deleted += 1;
      }
    }
    if (Object.keys(value).length === 0) {
      this.values.delete(key);
      this.expiresAt.delete(key);
    }
    return deleted;
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      this.removeIfExpired(key);
      if (this.values.delete(key)) deleted += 1;
      this.expiresAt.delete(key);
    }
    return deleted;
  }

  async expire(
    key: string,
    seconds: number,
    option?: ExpireOption,
  ): Promise<number> {
    this.removeIfExpired(key);
    if (!this.values.has(key)) return 0;
    if ((option === "NX" || option === "nx") && this.expiresAt.has(key)) {
      return 0;
    }
    this.expiresAt.set(key, Date.now() + seconds * 1_000);
    return 1;
  }

  async persist(key: string): Promise<number> {
    this.removeIfExpired(key);
    return this.expiresAt.delete(key) ? 1 : 0;
  }

  async ttl(key: string): Promise<number> {
    this.removeIfExpired(key);
    if (!this.values.has(key)) return -2;
    const expiresAt = this.expiresAt.get(key);
    if (expiresAt === undefined) return -1;
    return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1_000));
  }

  multi(): InMemoryRedisTransaction {
    return new InMemoryRedisTransaction(this);
  }

  asClient(): Redis {
    return this as unknown as Redis;
  }
}

class InMemoryRedisTransaction {
  private readonly commands: QueuedCommand[] = [];

  constructor(private readonly redis: InMemoryRedis) {}

  hset(key: string, fields: Record<string, unknown>): this {
    this.commands.push(() => this.redis.hset(key, fields));
    return this;
  }

  hdel(key: string, ...fields: string[]): this {
    this.commands.push(() => this.redis.hdel(key, ...fields));
    return this;
  }

  expire(key: string, seconds: number, option?: ExpireOption): this {
    this.commands.push(() => this.redis.expire(key, seconds, option));
    return this;
  }

  persist(key: string): this {
    this.commands.push(() => this.redis.persist(key));
    return this;
  }

  async exec(): Promise<unknown[]> {
    const results: unknown[] = [];
    for (const command of this.commands) results.push(await command());
    return results;
  }
}
