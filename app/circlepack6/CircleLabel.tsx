import { motion } from "framer-motion";
import { transitionConfig } from "./config";

type Circle = {
  x: number;
  y: number;
  r: number;
  data: {
    label: string;
    id: string;
  };
};

export default function CircleLabel({
  r,
  x,
  y,
  color,
  label,
}: {
  r: number;
  x: number;
  y: number;
  color: string;
  label: string;
}) {
  // Constrain the font size based on the circle's radius
  const maxFontSize = 20;
  const fontSize = Math.min(r * 0.2, maxFontSize);

  const sharedAnimationProps = {
    fill: color,
    x,
    y,
    fontSize,
  };

  const animationProps = {
    initial: {
      opacity: 0,
      scale: 0,
      ...sharedAnimationProps,
    },
    animate: {
      opacity: 1,
      scale: 1,
      ...sharedAnimationProps,
    },
    exit: {
      opacity: 0,
      scale: 0,
      ...sharedAnimationProps,
    },
  };

  return (
    <>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow
          dx="0"
          dy="2"
          stdDeviation="4"
          floodColor="black"
          floodOpacity="0.5"
        />
      </filter>
      <motion.text
        className="pointer-events-none select-none"
        transition={transitionConfig}
        textAnchor="middle"
        dominantBaseline="middle"
        {...animationProps}
      >
        {label}
      </motion.text>
    </>
  );
}
