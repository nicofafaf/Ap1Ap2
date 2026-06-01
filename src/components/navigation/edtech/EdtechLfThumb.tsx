import type { CSSProperties } from "react";
import { getNexusEntryForLF, publicAssetUrl, type LearningField } from "../../../data/nexusRegistry";
import { cyanAccent, goldAccent } from "./edtechHubTokens";
import { EdtechLazyVideo } from "./EdtechLazyVideo";
import { edtechCourseThumbWrap } from "./edtechCourseCardStyles";

type EdtechLfThumbProps = {
  lf: number;
  /** Füllt die Höhe des Eltern-Elements (z. B. responsives Klamp auf der Sektor-Karte) */
  fillContainer?: boolean;
};

/** Statischer Verlauf + Video nur bei Hover (Lernseite bleibt flüssig). */
export function EdtechLfThumb({ lf, fillContainer }: EdtechLfThumbProps) {
  const lfKey = `LF${lf}` as LearningField;
  const videoSrc =
    getNexusEntryForLF(lfKey).bossVisual.primaryPath || publicAssetUrl(`/assets/LF${lf}GIF.mp4`);

  const shell: CSSProperties = fillContainer
    ? {
        position: "relative",
        display: "block",
        width: "100%",
        height: "100%",
        minHeight: 0,
        background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
      }
    : {
        ...edtechCourseThumbWrap,
        display: "block",
      };

  return (
    <span style={shell}>
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: `linear-gradient(145deg, #0f172a 0%, #1e293b 42%, rgba(6,182,212,0.22) 100%)`,
        }}
      />
      <EdtechLazyVideo
        src={videoSrc}
        mode="viewport"
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
      />
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, transparent 0%, rgba(15,23,42,0.4) 50%, rgba(15,23,42,0.85) 100%)",
          pointerEvents: "none",
        }}
      />
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 3,
          background: `linear-gradient(90deg, ${cyanAccent}, ${goldAccent})`,
          opacity: 0.75,
        }}
      />
    </span>
  );
}
