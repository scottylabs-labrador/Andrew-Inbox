// import { useState, useEffect } from "react";

// export interface Announce {
//   id: number;
//   title: string;
//   course: string;
//   text: string;
//   date: Date;
//   isUnread: boolean;
// }

// export const useAnnounce = () => {
//   const [ann, setAnn] = useState<Announce[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Just fetch the JSON directly
//     fetch("/atesting.json")
//       .then((res) => {
//         if (!res.ok) throw new Error("Could not find data");
//         return res.json();
//       })
//       .then((data: any[]) => {
//         const hydrated = data.map((item) => ({
//           ...item,
//           date: new Date(item.date),
//           isUnread: item.isUnread ?? true,
//         }));
//         setAnn(hydrated);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Fetch error:", err);
//         setLoading(false);
//       });
//   }, []);

//   const toggleAnnounce = (id: number) => {
//     setAnn((prev) =>
//       prev.map((t) => (t.id === id ? { ...t, isUnread: !t.isUnread } : t)),
//     );
//   };

//   return {
//     ann,
//     loading,
//     toggleAnnounce,
//   };
// };
