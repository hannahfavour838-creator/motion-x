/** Lightweight shared definitions (no three.js imports) so the viewer UI stays out of the 3D bundle. */
export type ViewName = "front34" | "front" | "side" | "rear34" | "top";
export const VIEWS: Record<ViewName, { label: string; position: [number, number, number] }> = {
  front34: { label: "Front ¾", position: [6.2, 1.6, 6.6] },
  front: { label: "Front", position: [8.6, 1.1, 0] },
  side: { label: "Profile", position: [0, 1.2, 9.2] },
  rear34: { label: "Rear ¾", position: [-6.4, 1.7, 6.4] },
  top: { label: "Above", position: [0.01, 9.5, 0.6] },
};
export interface ShowroomHandle {
  setView: (v: ViewName) => void;
  reset: () => void;
  zoom: (factor: number) => void;
  orbit: (dAzimuth: number, dPolar: number) => void;
}
