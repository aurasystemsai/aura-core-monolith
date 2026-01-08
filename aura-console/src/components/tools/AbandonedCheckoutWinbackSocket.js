// aura-console/src/components/tools/AbandonedCheckoutWinbackSocket.js
// WebSocket client for real-time updates in Winback UI
import { useEffect } from 'react';

export default function useWinbackSocket(onMessage) {
  useEffect(() => {
    const ws = new window.WebSocket(
      window.location.origin.replace(/^http/, 'ws') + '/ws/abandoned-checkout-winback'
    );
    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        onMessage && onMessage(data);
      } catch {}
    };
    return () => ws.close();
  }, [onMessage]);
}
