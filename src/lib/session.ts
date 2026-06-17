export const getSessionId = () => {
  if (typeof window === "undefined") return "default";
  let sessionId = localStorage.getItem("demo_session_id");
  if (!sessionId) {
    sessionId = "demo_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("demo_session_id", sessionId);
  }
  return sessionId;
};

export const getCollectionName = (baseName: string) => {
  return `${baseName}_${getSessionId()}`;
};

export const getDocId = (baseName: string) => {
  return `${baseName}_${getSessionId()}`;
};
