import React, { useEffect, useState } from "react";
import "./NotificationsPanel.css";

function NotificationsPanel() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchNotifications() {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications", { credentials: "include" });
        const data = await res.json();
        if (isMounted) setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      } catch {
        if (isMounted) setNotifications([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  return (
    <section className="notifications-panel-card" style={{ marginTop: 10 }}>
      <div className="card-header">
        <h2 className="card-title" title="Recent alerts and notifications">Notifications & Alerts
          <span style={{ display: 'inline-block', marginLeft: 8, fontSize: 18, color: '#7fffd4', cursor: 'help' }} title="This panel shows recent system alerts, errors, and important updates.">ⓘ</span>
        </h2>
        <p className="card-subtitle">
          Stay up to date with system alerts, errors, and important updates.
        </p>
      </div>
      <div className="notifications-list">
        {loading ? (
          <div style={{ color: '#ffe066' }}>Loading…</div>
        ) : notifications.length === 0 ? (
          <div style={{ color: '#9ca3c7' }}>No notifications.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {notifications.map((n, idx) => (
              <li key={n.id || idx} className={`notification-item notification-${n.type || 'info'}`}>
                <span className="notification-time">{n.time ? new Date(n.time).toLocaleString() : ''}</span>
                <span className="notification-message">{n.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default NotificationsPanel;
