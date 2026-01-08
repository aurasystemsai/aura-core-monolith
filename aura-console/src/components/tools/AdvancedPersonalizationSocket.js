// aura-console/src/components/tools/AdvancedPersonalizationSocket.js
// WebSocket client for real-time updates in Advanced Personalization Engine UI
import { useEffect } from 'react';

export default function useAdvancedPersonalizationSocket(onMessage) {
  useEffect(() => {
    const ws = new window.WebSocket(
      window.location.origin.replace(/^http/, 'ws') + '/ws/advanced-personalization-engine'
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
