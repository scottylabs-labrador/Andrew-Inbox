import { useState } from "react";

export default function TabbedWindow() {
  const [activeTab, setActiveTab] = useState("Todo");

  return (
    <div style={{ width: "500px", height: "500px", border: "1px solid #ccc" }}>
      <div style={{ display: "flex", borderBottom: "1px solid #ccc" }}>
        <button
          onClick={() => setActiveTab("Todo")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeTab === "Todo" ? "#007bff" : "#e9ecef",
            color: activeTab === "Todo" ? "white" : "black",
            border: "none",
            cursor: "pointer",
          }}
        >
          Tab 1
        </button>
        <button
          onClick={() => setActiveTab("Annoucements")}
          style={{
            padding: "10px 20px",
            backgroundColor:
              activeTab === "Annoucements" ? "#007bff" : "#e9ecef",
            color: activeTab === "Annoucements" ? "white" : "black",
            border: "none",
            cursor: "pointer",
          }}
        >
          Tab 2
        </button>
      </div>
      <div style={{ padding: "20px" }}>
        {activeTab === "Todo" && <div>Content for Tab 1</div>}
        {activeTab === "Annoucements" && <div>Content for Tab 2</div>}
      </div>
    </div>
  );
}
