import { View } from "react-native";
import Svg, { Path, Defs, Pattern, Rect } from "react-native-svg";

// Tiling 8-point star tile from the design's inline data-URI; injected as an SVG pattern.
export function MasjidPattern({ opacity = 0.09 }: { opacity?: number }) {
  return (
    <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="stars" width={80} height={80} patternUnits="userSpaceOnUse">
            <Path
              d="M40 4l9 22 22-9-9 22 22 9-22 9 9 22-22-9-9 22-9-22-22 9 9-22-22-9 22-9-9-22 22 9z"
              fill="none"
              stroke="#ffffff"
              strokeOpacity={opacity}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#stars)" />
      </Svg>
    </View>
  );
}
