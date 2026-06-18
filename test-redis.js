const Redis = require("ioredis");

const redis = new Redis({
  host: "64.227.144.208",
  port: 6379,
  password: "MJRedis@123",
});

(async () => {
  try {
    console.log(await redis.ping());

    await redis.set("name", "Mitesh");
    const value = await redis.get("name");

    console.log("Value:", value);

    redis.disconnect();
  } catch (err) {
    console.error(err);
  }
})();
