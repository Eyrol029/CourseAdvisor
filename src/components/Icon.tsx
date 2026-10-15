import { ReactNode } from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { colors } from "../theme";

export type IconName =
  | "arrow" | "book" | "calendar" | "check" | "chevron" | "clock"
  | "close" | "compass" | "home" | "lock" | "logout" | "minus" | "plus"
  | "route" | "search" | "spark" | "user" | "warning";

const shapes: Record<IconName, ReactNode> = {
  arrow: <Path d="M5 12h14M14 7l5 5-5 5" />,
  book: (
    <>
      <Path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
      <Path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
    </>
  ),
  calendar: (
    <>
      <Rect x="3" y="5" width="18" height="16" rx="2" />
      <Path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  check: <Path d="m5 12 4 4L19 6" />,
  chevron: <Path d="m9 18 6-6-6-6" />,
  clock: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  close: <Path d="M6 6l12 12M18 6 6 18" />,
  compass: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  home: (
    <>
      <Path d="m3 11 9-8 9 8" />
      <Path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  lock: (
    <>
      <Rect x="5" y="10" width="14" height="11" rx="2" />
      <Path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  logout: (
    <>
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Path d="m16 17 5-5-5-5" />
      <Path d="M21 12H9" />
    </>
  ),
  minus: <Path d="M5 12h14" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  route: (
    <>
      <Circle cx="6" cy="18" r="2" />
      <Circle cx="18" cy="6" r="2" />
      <Path d="M8 18h3a3 3 0 0 0 3-3v-6a3 3 0 0 1 3-3" />
    </>
  ),
  search: (
    <>
      <Circle cx="11" cy="11" r="7" />
      <Path d="m20 20-4-4" />
    </>
  ),
  spark: (
    <Path d="m12 3 1.2 4.1a5 5 0 0 0 3.4 3.4l4.1 1.2-4.1 1.2a5 5 0 0 0-3.4 3.4L12 20.4l-1.2-4.1a5 5 0 0 0-3.4-3.4l-4.1-1.2 4.1-1.2a5 5 0 0 0 3.4-3.4L12 3Z" />
  ),
  user: (
    <>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  warning: (
    <>
      <Path d="M12 3 2.5 20h19L12 3Z" />
      <Path d="M12 9v5M12 17h.01" />
    </>
  ),
};

export default function Icon({
  name,
  size = 20,
  color = colors.ink,
}: {
  name: IconName;
  size?: number;
  color?: any;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shapes[name]}
    </Svg>
  );
}