const key = "social-scheduler-content-engine";
const meta = { id: key, name: "Social Scheduler Content Engine", description: "Automates social content scheduling." };

function buildSchedule(posts, startAt, intervalMinutes, timezone) {
  const schedule = [];
  const baseTs = startAt ? new Date(startAt).getTime() : Date.now();
  const gapMs = intervalMinutes * 60 * 1000;

  posts.forEach((post, idx) => {
    const ts = new Date(baseTs + idx * gapMs);
    schedule.push({
      id: post.id || `post-${idx + 1}`,
      channel: post.channel || "instagram",
      content: post.content || post.text || "",
      media: post.media || null,
      scheduledFor: ts.toISOString(),
      timezone,
      status: "scheduled",
    });
  });

  return schedule;
}

async function run(input = {}, ctx = {}) {
  const env = (ctx.env && ctx.env.NODE_ENV) || "development";
  const posts = Array.isArray(input.posts) ? input.posts : [];
  const intervalMinutes = Number(input.intervalMinutes || 90);
  const timezone = input.timezone || "UTC";
  const startAt = input.startAt || null;

  const schedule = buildSchedule(posts, startAt, intervalMinutes, timezone);
  const channels = [...new Set(schedule.map((s) => s.channel))];

  return {
    ok: true,
    tool: key,
    message: "Social schedule generated.",
    environment: env,
    input,
    output: {
      schedule,
      stats: {
        totalPosts: schedule.length,
        channels,
        intervalMinutes,
      },
    },
  };
}

module.exports = { key, run, meta };
