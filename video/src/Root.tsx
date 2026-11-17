import React from "react";
import { Composition } from "remotion";
import { Launch } from "./Launch";
import { DURATION, FPS, H, W } from "./lib/theme";

export const Root: React.FC = () => (
  <Composition
    id="Launch"
    component={Launch}
    durationInFrames={DURATION}
    fps={FPS}
    width={W}
    height={H}
  />
);
