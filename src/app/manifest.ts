import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Caiet de Cântări",
    short_name: "Cântări",
    description: "Melodiile tinerilor de la Biserica Bartolomeu",
    start_url: "/",
    display: "standalone",
    background_color: "#f0f2f5",
    theme_color: "#4338ca",
    orientation: "portrait-primary",
    categories: ["music", "religion"],
    icons: [
      {
        src: "/api/pwa-icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/api/pwa-icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/pwa-icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
