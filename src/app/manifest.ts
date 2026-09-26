import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Бюджет VF",
    short_name: "Бюджет",
    description: "Личный бюджет по таблице Budget VF: банки, чеки, Данил и Влад.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4EFE6",
    theme_color: "#1B4D3E",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
