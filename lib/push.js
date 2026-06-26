import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:admin@tutorhub.local",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function sendPushToSubscriptions(subscriptions, payload) {
  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(payload))
    )
  );

  const deadEndpoints = [];
  let successCount = 0;
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      successCount += 1;
    } else if ([404, 410].includes(r.reason?.statusCode)) {
      deadEndpoints.push(subscriptions[i].endpoint);
    }
  });

  return { successCount, deadEndpoints };
}
