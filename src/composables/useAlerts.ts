import { reactive } from "vue";

export type AlertItem = { threshold: number; direction: "above" | "below"; triggered: boolean };
const STORAGE_KEY = "cryptoWidget.alerts";

export function useAlerts() {
  const alertStates = reactive<Record<string, AlertItem[]>>({});

  const loadAlerts = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(parsed || {}).forEach(k => {
          alertStates[k] = parsed[k];
        });
      }
    } catch (e) {
      console.error("Failed to load alerts", e);
    }
  };

  const saveAlerts = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alertStates));
    } catch (e) {
      console.error("Failed to save alerts", e);
    }
  };

  const addAlert = (id: string, threshold: number, direction: "above" | "below") => {
    const list = alertStates[id] || [];
    list.push({ threshold, direction, triggered: false });
    alertStates[id] = list;
    saveAlerts();
  };

  const removeAlert = (id: string, idx: number) => {
    const list = alertStates[id] || [];
    list.splice(idx, 1);
    alertStates[id] = [...list];
    saveAlerts();
  };

  const acknowledgeAlerts = (id: string) => {
    const list = alertStates[id] || [];
    list.forEach(a => (a.triggered = false));
    alertStates[id] = [...list];
    saveAlerts();
  };

  const evalAlertFor = (id: string, last: number) => {
    const list = alertStates[id] || [];
    list.forEach(cfg => {
      if (cfg.direction === "below" && last <= cfg.threshold) {
        cfg.triggered = true;
      } else if (cfg.direction === "above" && last >= cfg.threshold) {
        cfg.triggered = true;
      } else {
        cfg.triggered = false;
      }
    });
  };

  const alertClass = (id: string) => {
    const list = alertStates[id] || [];
    const anyAbove = list.some(a => a.triggered && a.direction === "above");
    const anyBelow = list.some(a => a.triggered && a.direction === "below");
    if (anyAbove && anyBelow) return "alert-mixed";
    if (anyAbove) return "alert-above";
    if (anyBelow) return "alert-below";
    return "";
  };

  const containerAlertClass = () => {
    let above = false;
    let below = false;
    Object.values(alertStates).forEach(list => {
      (list || []).forEach(a => {
        if (a.triggered) {
          if (a.direction === "above") above = true;
          if (a.direction === "below") below = true;
        }
      });
    });
    if (above && below) return "alert-mixed";
    if (above) return "alert-above";
    if (below) return "alert-below";
    return "";
  };

  return {
    alertStates,
    loadAlerts,
    saveAlerts,
    addAlert,
    removeAlert,
    acknowledgeAlerts,
    evalAlertFor,
    alertClass,
    containerAlertClass
  };
}



