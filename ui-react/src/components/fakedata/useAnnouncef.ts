import { useState } from "react";
import announceData from "./atestingf.json";

export interface Announce {
  id: number;
  title: string;
  course: string;
  text: string;
  date: Date;
  isUnread: boolean;
}

export const useAnnouncef = () => {
  const [ann, setAnn] = useState<Announce[]>(
    announceData.map((item) => ({
      ...item,
      date: new Date(item.date),
      isUnread: item.isUnread ?? true,
    })),
  );

  const loading = false;

  const toggleAnnounce = (id: number) => {
    setAnn((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isUnread: !t.isUnread } : t)),
    );
  };

  return { ann, loading, toggleAnnounce };
};
