import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface UserProfile {
  prenom: string;
  age: string;
  poids: string;
  genre: "homme" | "femme" | "autre" | "";
}

export interface Ressenti {
  amelioration: string;
  effetsIndesirables: string;
  etatGlobal: "bien" | "moyen" | "mal" | "";
}

export interface NotificationEntry {
  id: string;
  timestamp: Date;
  status: "confirmed" | "postponed" | "pending";
  medicament: string;
  dosage: string;
  forme: string;
  ressenti?: Ressenti;
}

interface ContextValue {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  notifications: NotificationEntry[];
  addNotification: (n: Omit<NotificationEntry, "id">) => void;
  updateNotificationStatus: (id: string, status: NotificationEntry["status"]) => void;
  updateNotificationRessenti: (id: string, ressenti: Ressenti) => void;
  showConfirmModal: boolean;
  setShowConfirmModal: (v: boolean) => void;
  onClosePanel?: () => void;
  setOnClosePanel: (fn: (() => void) | undefined) => void;
}

const ProfileNotificationContext = createContext<ContextValue | null>(null);

const PROFILE_KEY = "app_user_profile";
const NOTIFS_KEY = "app_notification_history";

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { prenom: "", age: "", poids: "", genre: "" };
}

function loadNotifications(): NotificationEntry[] {
  try {
    const raw = localStorage.getItem(NOTIFS_KEY);
    if (raw) {
      return JSON.parse(raw).map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
    }
  } catch {}
  return [];
}

export function ProfileNotificationProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(loadProfile);
  const [notifications, setNotifications] = useState<NotificationEntry[]>(loadNotifications);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [onClosePanel, setOnClosePanelState] = useState<(() => void) | undefined>(undefined);
  const setOnClosePanel = useCallback((fn: (() => void) | undefined) => setOnClosePanelState(() => fn), []);

  const setProfile = useCallback((p: UserProfile) => {
    setProfileState(p);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  }, []);

  useEffect(() => {
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback((n: Omit<NotificationEntry, "id">) => {
    setNotifications((prev) => [{ ...n, id: crypto.randomUUID() }, ...prev]);
  }, []);

  const updateNotificationStatus = useCallback((id: string, status: NotificationEntry["status"]) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status } : n)));
  }, []);

  const updateNotificationRessenti = useCallback((id: string, ressenti: Ressenti) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, ressenti } : n)));
  }, []);

  return (
    <ProfileNotificationContext.Provider value={{ profile, setProfile, notifications, addNotification, updateNotificationStatus, updateNotificationRessenti, showConfirmModal, setShowConfirmModal, onClosePanel, setOnClosePanel }}>
      {children}
    </ProfileNotificationContext.Provider>
  );
}

export function useProfileNotification() {
  const ctx = useContext(ProfileNotificationContext);
  if (!ctx) throw new Error("useProfileNotification must be used within provider");
  return ctx;
}