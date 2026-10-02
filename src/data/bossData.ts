import { BossDefinition } from '../types';

export const bossRoster: BossDefinition[] = [
  {
    id: 'boss-shadow-overlord',
    name: 'Apex Shadow Overlord',
    subtitle: 'The Weekly Sovereign of Ruin',
    element: 'shadow',
    avatarUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80',
    description: 'An ancient dread manifestation that feeds on complacency. Only balanced mastery across all physical disciplines can shatter its dark armor.',
    weakness: 'pushups',
    dayOfWeek: 0, // Sunday
    baseMultiplier: 1.25,
    themeColor: 'from-zinc-900 via-stone-900 to-black',
  },
  {
    id: 'boss-ironclad-goliath',
    name: 'Ironclad Goliath',
    subtitle: 'The Unbroken Bastion',
    element: 'earth',
    avatarUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80',
    description: 'A monolithic titan clad in forged granite. Immune to light attacks; vulnerable only to heavy gym resistance training and raw muscular power.',
    weakness: 'gym',
    dayOfWeek: 1, // Monday
    baseMultiplier: 1.0,
    themeColor: 'from-amber-600 via-stone-700 to-stone-900',
  },
  {
    id: 'boss-zephyr-drake',
    name: 'Zephyr Storm Drake',
    subtitle: 'Gale of the High Spires',
    element: 'wind',
    avatarUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
    description: 'A tempestuous dragon commanding the vortex. Can only be caught and grounded through unrelenting cardio distance, running, and high stamina.',
    weakness: 'cardio',
    dayOfWeek: 2, // Tuesday
    baseMultiplier: 1.0,
    themeColor: 'from-cyan-500 via-teal-600 to-slate-900',
  },
  {
    id: 'boss-obsidian-colossus',
    name: 'Obsidian Colossus',
    subtitle: 'Core of the Deep Abyss',
    element: 'void',
    avatarUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
    description: 'Hardened volcanic behemoth with dense mineral plating. Bodyweight pushups and chest compression strike straight into its molten core fissures.',
    weakness: 'pushups',
    dayOfWeek: 3, // Wednesday
    baseMultiplier: 1.05,
    themeColor: 'from-slate-700 via-zinc-800 to-black',
  },
  {
    id: 'boss-ignis-behemoth',
    name: 'Ignis Pyre Behemoth',
    subtitle: 'Lord of the Ash Plains',
    element: 'fire',
    avatarUrl: 'https://images.unsplash.com/photo-1519074069444-1ba4ea16e89a?w=400&auto=format&fit=crop&q=80',
    description: 'A raging inferno beast that burns hotter with every second of stillness. Extinguish its fury with high-intensity interval training (HIIT).',
    weakness: 'hiit',
    dayOfWeek: 4, // Thursday
    baseMultiplier: 1.1,
    themeColor: 'from-orange-600 via-rose-600 to-red-950',
  },
  {
    id: 'boss-venomfang-wyrm',
    name: 'Venomfang Wyrm',
    subtitle: 'Coil of the Poison Mire',
    element: 'poison',
    avatarUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&auto=format&fit=crop&q=80',
    description: 'A serpentine beast striking from shadowed crevices. Demands supple flexibility, mobility routines, and agile body control to outmaneuver.',
    weakness: 'flexibility',
    dayOfWeek: 5, // Friday
    baseMultiplier: 1.0,
    themeColor: 'from-emerald-600 via-lime-700 to-slate-950',
  },
  {
    id: 'boss-frost-dreadnought',
    name: 'Frost Dreadnought',
    subtitle: 'Glacier of the North Realm',
    element: 'ice',
    avatarUrl: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=400&auto=format&fit=crop&q=80',
    description: 'An ancient ice-bound construct threatening eternal frost. Melts only under prolonged sustained high calorie burn from rigorous cardio and intervals.',
    weakness: 'cardio',
    dayOfWeek: 6, // Saturday
    baseMultiplier: 1.15,
    themeColor: 'from-sky-500 via-blue-600 to-indigo-950',
  },
];

/**
 * Deterministically returns the active boss for a given calendar date string (YYYY-MM-DD)
 */
export function getBossForDate(dateStr: string): BossDefinition {
  const parts = dateStr.split('-');
  let dayOfWeek = 0;
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    dayOfWeek = d.getDay();
  } else {
    dayOfWeek = new Date().getDay();
  }

  const match = bossRoster.find((b) => b.dayOfWeek === dayOfWeek);
  return match || bossRoster[0];
}
