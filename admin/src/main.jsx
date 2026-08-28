import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Safely patch Range methods so character offset calculations during PDF generation / DOM measurement never exceed text node length
if (typeof window !== "undefined" && window.Range) {
  const originalSetStart = Range.prototype.setStart;
  const originalSetEnd = Range.prototype.setEnd;

  Range.prototype.setStart = function (node, offset) {
    let safeOffset = offset;
    if (node) {
      if (
        node.nodeType === Node.TEXT_NODE ||
        node.nodeType === Node.COMMENT_NODE ||
        node.nodeType === Node.CDATA_SECTION_NODE
      ) {
        const len = (node.textContent || node.nodeValue || "").length;
        safeOffset = Math.max(0, Math.min(Number(offset) || 0, len));
      } else if (node.childNodes) {
        safeOffset = Math.max(0, Math.min(Number(offset) || 0, node.childNodes.length));
      }
    }
    return originalSetStart.call(this, node, safeOffset);
  };

  Range.prototype.setEnd = function (node, offset) {
    let safeOffset = offset;
    if (node) {
      if (
        node.nodeType === Node.TEXT_NODE ||
        node.nodeType === Node.COMMENT_NODE ||
        node.nodeType === Node.CDATA_SECTION_NODE
      ) {
        const len = (node.textContent || node.nodeValue || "").length;
        safeOffset = Math.max(0, Math.min(Number(offset) || 0, len));
      } else if (node.childNodes) {
        safeOffset = Math.max(0, Math.min(Number(offset) || 0, node.childNodes.length));
      }
    }
    return originalSetEnd.call(this, node, safeOffset);
  };
}

// Suppress unhandled DOM Range / Selection errors caused by external browser extensions (Grammarly, Chrome Translate, etc.)
window.addEventListener("error", (event) => {
  const msg = event?.message || "";
  if (
    msg.includes("setEnd") ||
    msg.includes("setStart") ||
    msg.includes("Range") ||
    msg.includes("removeChild") ||
    msg.includes("insertBefore")
  ) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return true;
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
