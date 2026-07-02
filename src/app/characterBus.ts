/* Tiny shared blackboard so the two ambient characters can notice each other
   (the bug strolls over to the droid; the droid looks down and waves back).
   Plain mutable fields — written by their owners each frame/tick and read by
   the other side; never touches React state, so no re-renders. */

export const bugPos = { x: -9999, y: -9999, active: false };
export const droidPos = { x: -9999, y: -9999, active: false };
