import { useEffect, useRef, useState } from "react";
import { imageUrl } from "./labelDocument.js";

export default function LabelCanvas({ label, canvasRef, language = "en" }) {
  const viewport = useRef(null);
  const paper = useRef(null);
  const [size, setSize] = useState({ scale: 1, height: 200 });

  useEffect(() => {
    const viewportNode = viewport.current;
    const paperNode = paper.current;
    let active = true;
    const update = () => {
      if (active && viewportNode?.isConnected && paperNode?.isConnected) {
        setSize({ scale: Math.min(1, viewportNode.clientWidth / 720), height: paperNode.scrollHeight });
      }
    };
    const observer = new ResizeObserver(update);
    if (viewportNode) observer.observe(viewportNode);
    if (paperNode) observer.observe(paperNode);
    update();
    return () => {
      active = false;
      observer.disconnect();
    };
  }, []);

  let rawSections = label?.sections;
  if (typeof rawSections === "string") {
    try {
      rawSections = JSON.parse(rawSections);
    } catch {
      rawSections = [];
    }
  }
  const sections = Array.isArray(rawSections) ? rawSections : [];

  return (
    <div className="label-viewport" ref={viewport} style={{ height: size.height * size.scale }}>
      <article
        className="label-paper"
        translate="no"
        lang={language}
        ref={(node) => {
          paper.current = node;
          if (canvasRef) canvasRef.current = node;
        }}
        style={{ transform: `scale(${size.scale})` }}
      >
        <div className="label-paper__title-bar">
          <span className="label-paper__title">{label?.title || "Untitled label"}</span>
        </div>
        {sections.map((section) => {
          let rawRows = section?.rows;
          if (typeof rawRows === "string") {
            try {
              rawRows = JSON.parse(rawRows);
            } catch {
              rawRows = [];
            }
          }
          const rows = Array.isArray(rawRows) ? rawRows : [];
          const activeRows = rows.filter((r) => r && (r.key || r.value));

          return (
            <section className="label-paper__section" key={section.id || Math.random()}>
              <div className="label-paper__heading">
                {section.logoPath && (
                  <img crossOrigin="anonymous" src={imageUrl(section.logoPath)} alt="Section logo" />
                )}
                <div className="label-paper__heading-text">
                  <h2
                    style={{
                      fontSize:
                        Number(section.fontSizePx) >= 8 ? Math.min(200, Number(section.fontSizePx)) : 32,
                    }}
                  >
                    {section.heading || "Heading text"}
                  </h2>
                  {section.subHeading && (
                    <h3
                      style={{
                        fontSize:
                          Number(section.subFontSizePx) >= 8
                            ? Math.min(200, Number(section.subFontSizePx))
                            : 20,
                      }}
                    >
                      {section.subHeading}
                    </h3>
                  )}
                </div>
                {section.rightLogoPath && (
                  <img crossOrigin="anonymous" src={imageUrl(section.rightLogoPath)} alt="Right logo" />
                )}
              </div>
              {activeRows.length > 0 && (
                <table>
                  <thead>
                    <tr>
                      <th className="label-paper__num-col">{label.tableHeaderNo || "S.NO"}</th>
                      <th>{label.tableHeaderField || "FIELD"}</th>
                      <th>{label.tableHeaderDetail || "DETAIL"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRows.map((row, rowIdx) => (
                      <tr key={row.id || rowIdx}>
                        <td className="label-paper__num-col">{rowIdx + 1}</td>
                        <th scope="row">{row.key}</th>
                        <td>{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          );
        })}
      </article>
    </div>
  );
}
