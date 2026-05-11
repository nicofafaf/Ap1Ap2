/** Weißes Glas-Rauschen — identisch zur Iridium-Panel-Textur (feTurbulence) */
export const NX_GLASS_NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='nxn'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23nxn)'/%3E%3C/svg%3E")`;

/** Basis-Opacity (::before-Niveau); Hover-Resonanz +15 % */
export const NX_GLASS_NOISE_OPACITY_IDLE = 0.055;
export const NX_GLASS_NOISE_OPACITY_HOVER = NX_GLASS_NOISE_OPACITY_IDLE * 1.15;
