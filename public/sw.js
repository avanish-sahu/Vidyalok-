self.addEventListener("push", (event) => {
  let data = { title: "TutorHub", body: "" };
  try {
    data = event.data.json();
  } catch {
    data.body = event.data?.text() || "";
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "TutorHub", {
      body: data.body || "",
      data: { url: data.url || "/notifications" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/notifications";
  event.waitUntil(self.clients.openWindow(url));
});
