import React from "react";
import ReactDOM from "react-dom";

export function Tip({ text, children }) {
  const [pos, setPos] = React.useState(null);

  const show = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: r.left + r.width / 2, y: r.top - 8 });
  };

  return (
    <span
      onMouseEnter={show}
      onMouseLeave={() => setPos(null)}
      style={{ borderBottom: "1px dotted #555", cursor: "help" }}
    >
      {children}
      {pos && typeof document !== "undefined" && ReactDOM.createPortal(
        <div style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          transform: "translate(-50%, -100%)",
          background: "#1a1a1a",
          border: "1px solid #333",
          color: "#ccc",
          padding: "6px 10px",
          fontSize: "0.72rem",
          lineHeight: 1.4,
          maxWidth: 240,
          zIndex: 9999,
          pointerEvents: "none",
          whiteSpace: "normal",
        }}>
          {text}
        </div>,
        document.body
      )}
    </span>
  );
}