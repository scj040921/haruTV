import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "haruTV",
    short_name: "haruTV",
    description: "你的私人桌面放映室",
    start_url: "/",
    display: "standalone",
    background_color: "#181c1a",
    theme_color: "#254c40",
    icons: [
      {
        src: "/harutv.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
