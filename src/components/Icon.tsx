import { SvgXml } from "react-native-svg";
import { glyphs } from "../theme/glyphs";

// Name→alias map typed so a typo is a compile error. Aliases exist because the design
// uses Solar's `-duotone` names, which have no solid parent here and render solid.
const NAME_ALIASES: Record<string, string> = glyphs.aliases;

export type IconName = keyof typeof glyphs.icons | keyof typeof NAME_ALIASES;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 20, color = "#0f172a" }: IconProps) {
  const key = NAME_ALIASES[name as string] ?? (name as string);
  const data = glyphs.icons[key as keyof typeof glyphs.icons];
  if (!data) {
    // Fail loud in dev: an undefined alias renders a silent blank.
    if (__DEV__) console.warn(`[Icon] unknown name "${String(name)}"`);
    return null;
  }
  // currentColor inherits the wrapper's color via SvgXml's color prop.
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${glyphs.width} ${glyphs.height}" fill="${color}" color="${color}" width="${size}" height="${size}">${data.body}</svg>`;
  return <SvgXml xml={xml} width={size} height={size} />;
}
