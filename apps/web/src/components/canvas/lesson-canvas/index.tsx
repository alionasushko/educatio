"use client";

import dynamic from "next/dynamic";

const CanvasStage = dynamic(() => import("../canvas-stage"), {
  ssr: false,
  loading: () => <div className="bg-bg h-full w-full" />,
});

const LessonCanvas = () => <CanvasStage />;

export default LessonCanvas;
