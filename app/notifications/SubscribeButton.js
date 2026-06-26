"use client";

import { useEffect, useState } from "react";
import { getPushStatus, subscribeToPush } from "@/lib/pushClient";

export default function SubscribeButton() {
  const [status, setStatus] = useState("checking");
  const [error, setError] = useState("");

  useEffect(() => {
    getPushStatus().then(setStatus);
  }, []);

  async function handleSubscribe() {
    setError("");
    try {
      await subscribeToPush();
      setStatus("subscribed");
    } catch (err) {
      setError(err.message);
    }
  }

  if (status === "checking") return null;

  if (status === "unsupported") {
    return (
      <div className="error-banner" style={{ marginBottom: 16 }}>
        This browser doesn&apos;t support push notifications.
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="error-banner" style={{ marginBottom: 16 }}>
        Notifications are blocked for this site. Enable them in your browser settings to get
        alerts when your teacher sends a message.
      </div>
    );
  }

  if (status === "subscribed") {
    return (
      <div className="badge badge-success" style={{ marginBottom: 16 }}>
        Notifications enabled on this device
      </div>
    );
  }

  return (
    <div className="card-block">
      {error && <div className="error-banner">{error}</div>}
      <p style={{ marginBottom: 12 }}>
        Turn on notifications to get alerted on this device when your teacher sends a message.
      </p>
      <button className="btn" onClick={handleSubscribe}>
        Enable Notifications
      </button>
    </div>
  );
}
