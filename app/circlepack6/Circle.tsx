import { SVGMotionProps, motion } from "framer-motion";

import { transitionConfig } from "./animation";

type Circle = {
  x: number;
  y: number;
  r: number;
  fill?: string;
  stroke?: string;
} & SVGMotionProps<SVGCircleElement>;

export default function Circle({ r, x, y, fill, stroke, ...rest }: Circle) {
  const sharedAnimationProps = {
    fill,
    stroke,
    x: x,
    y: y,
    r,
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
    <motion.circle
      transition={transitionConfig}
      {...animationProps}
      {...rest}
    />
  );
}
