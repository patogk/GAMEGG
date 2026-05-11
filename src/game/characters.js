// Character catalog. 4 personajes iniciales con special distinto.
// Cada personaje es un preset: identidad visual + special. Mecánicamente las
// cabezas son iguales en Sprint 02 (mismo radius, mass, jump) — la diferencia
// es estética + special.

export const CHARACTERS = [
  {
    id: 'spark',
    name: 'SPARK',
    accent: '#00E5FF',
    mouthShape: 'smile',
    specialType: 'fire-impulse',
    specialName: 'IMPULSO',
    taunt: '¡eso ni lo viste!',
  },
  {
    id: 'jumpy',
    name: 'JUMPY',
    accent: '#A6FF00',
    mouthShape: 'line',
    specialType: 'mega-jump',
    specialName: 'MEGA-SALTO',
    taunt: '¡saltó como un canguro!',
  },
  {
    id: 'zoom',
    name: 'ZOOM',
    accent: '#FF1AA1',
    mouthShape: 'smile',
    specialType: 'freeze-dash',
    specialName: 'DASH FANTASMA',
    taunt: '¡no me viste pasar!',
  },
  {
    id: 'pull',
    name: 'PULL',
    accent: '#FFE500',
    mouthShape: 'line',
    specialType: 'magnet-pull',
    specialName: 'IMÁN',
    taunt: '¡la pelota es mía!',
  },
];

export function getCharacterById(id) {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
