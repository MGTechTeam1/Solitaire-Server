import Redis, {Cluster} from "ioredis";
import "dotenv/config";

type RedisKeys =
    | "server-token" | "statistic-reset-delay"

type RedisData<T> = {
    data: T;
    expiry: number;
}

const RedisServices = (() => {
    let cluster: Cluster | null = null;

    const ensure = (): Cluster => {
        if (!cluster) {
            cluster = new Cluster([7000, 7001, 7002].map(port => ({
                port: port,
                host: process.env.REDIS_HOST
            })), {
                redisOptions: {
                    password: process.env.REDIS_PASSWORD,
                    keepAlive: 50000
                },
                shardedSubscribers: true,
            });
            cluster.on("connect", () => console.log("✅ Redis connected"));
            cluster.on("error", (err) => console.error("❌ Redis error:", err));
        }
        return cluster;
    };


    const buildKey = (key: RedisKeys | string, identifier?: string) =>
        identifier ? `${key}:${identifier}` : key;

    async function revalidate<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttl: number,
        retries = 5
    ): Promise<T> {
        const inflightKey = `inflight:${key}`;
        const client = ensure();

        // coba ambil lock biar tidak thundering herd
        const gotLock = await client.set(inflightKey, "1", "PX", 2000, "NX");
        //const gotLock = await client.setex(inflightKey, 2000,"1")

        if (gotLock) {
            console.log(`🔒 [Lock acquired] ${inflightKey}`);
            try {
                console.log(`⚡ [Fetching fresh data] ${key}`);
                const fresh = await fetchFn();
                const expiry = Date.now() + ttl * 1000;

                // simpan cache dengan TTL biar auto expired
                await client.setex(key, ttl, JSON.stringify({ data: fresh, expiry }));
                console.log(`💾 [Cache set] ${key} (ttl: ${ttl}s)`);

                return fresh;
            } finally {
                await client.del(inflightKey);
                console.log(`🔓 [Lock released] ${inflightKey}`);
            }
        } else {
            console.warn(`⏳ [Lock busy] ${inflightKey}, waiting for cache`);
            // request lain → tunggu cache diisi
            for (let i = 0; i < retries; i++) {
                await new Promise(res => setTimeout(res, 100));
                const cached = await client.get(key);
                if (cached) {
                    console.log(`✅ [Cache ready from inflight] ${key}`);
                    return JSON.parse(cached).data as T;
                }
            }
            console.error(`❌ [Timeout] waiting for inflight fetch ${key}`);
            throw new Error("Timeout waiting for inflight fetch");
        }
    }

    return {
        redis: ensure(),

        set: async (key: RedisKeys, value: any, identifier?: string, ttl = 60) => {
            const client = ensure();
            const redisKey = buildKey(key, identifier);
            const expiry = Date.now() + ttl * 1000;

            return client.setex(redisKey, ttl, JSON.stringify({ data: value, expiry }));
        },
        //Stale-While-Revalidate (SWrV) + In-Flight deduplication
        getWithSwr: async <T>(
            key: RedisKeys | string,
            identifier?: string,
            fetchFn?: () => Promise<T>,
            ttl = 60,
            retries = 5
        ): Promise<T | null> => {
            const cluster = ensure();
            const redisKey = buildKey(key, identifier);

            const raw = await cluster.get(redisKey);
            if (raw) {
                const { data, expiry } = JSON.parse(raw) as RedisData<T>;
                const now = Date.now();

                if (now < expiry) {
                    // ✅ Cache masih fresh
                    console.log(`✅ [Cache hit] ${redisKey} (expires in ${expiry - now}ms)`);
                    return data;
                } else {
                    // ⚠ Cache stale → tetap pakai data lama, fetch baru di background
                    console.warn(`⚠ [Cache stale] ${redisKey}, using stale data`);
                    if (fetchFn) {
                        revalidate(redisKey, fetchFn, ttl, retries).catch(err =>
                            console.error(`❌ [Revalidate error] ${redisKey}`, err)
                        );
                    }
                    return data;
                }
            }

            // ❌ Cache miss
            console.log(`❌ [Cache miss] ${redisKey}`);
            if (!fetchFn) return null;

            return await revalidate(redisKey, fetchFn, ttl, retries);
        }
    };
})();

export default RedisServices;