import { FormatKey } from './types';

export const API_BASE = 'https://api.scryfall.com/cards/search';

export const QUERY_FILTERS =
  '+-s%3Alea+-s%3Aleb+-s%3Aunk+-t%3Abasic+-is%3Atoken+-t%3Aemblem' +
  '+-s%3A30a+-s%3Aced+-s%3Acei+-s%3Aptc' +
  '+-s%3Asld+-s%3Aslp+-s%3Aslc+-s%3Aslu+-s%3Apssc' +
  '+-border%3Agold';

export const SET_FILTERS =
  '+-s%3Alea+-s%3Aleb+-s%3Aunk' +
  '+-s%3A30a+-s%3Aced+-s%3Acei+-s%3Aptc' +
  '+-s%3Asld+-s%3Aslp+-s%3Aslc+-s%3Aslu+-s%3Apssc' +
  '+-border%3Agold';

export const QUERY_SUFFIX = '&order=usd&dir=desc&unique=prints';

export const FORMATS: Record<string, string> = {
  y1993_2003: 'date%3E%3D1995-01-01+date%3C%3D2003-12-31',
  y2004_2014: 'date%3E%3D2004-01-01+date%3C%3D2014-12-31',
  y2015_2020: 'date%3E%3D2015-01-01+date%3C%3D2020-12-31',
  y2021_2022: 'date%3E%3D2021-01-01+date%3C%3D2022-12-31',
  y2023_2025: 'date%3E%3D2023-01-01+date%3C%3D2025-12-31',
  y2026_: 'date%3E%3D2026-01-01',
};

export const RATE_LIMIT_DELAY = 100; // ms

export const EXCLUDED_SETS = [
  'Foreign Black Border',
  'Summer Magic / Edgar',
  'Beatdown Box Set',
  'Battle Royale Box Set',
  'Media and Collaboration Promos',
  'Unglued',
  'Renaissance',
  'Introductory Two-Player Set',
  'MicroProse Promos',
  'Fourth Edition Foreign Black Border',
  'Unlimited Edition',
  'Rinascimento',
  'Salvat 2005',
  'Salvat 2011',
  'Planechase Planes',
  'Planechase',
  'Archenemy Schemes',
  'Archenemy',
  'DCI Promos',
  'New Phyrexia Promos',
  'Planechase 2012 Planes',
  'Planechase 2012',
  'Face the Hydra',
  'Battle the Horde',
  'M15 Prerelease Challenge',
  'Planechase Anthology Planes',
  'Planechase Anthology',
  'Commander Anthology Tokens',
  'Commander Anthology Volume II Tokens',
  'Commander Anthology Volume II',
  'Core Set 2020 Promos',
  'The List',
  'Adventures in the Forgotten Realms Tokens',
  'Mystery Booster 2',
];

export const EXCLUDED_PREFIXES = ['Duel Decks:', 'Duel Decks Anthology:', 'Archenemy:'];

export const ALL_FORMAT_KEYS: FormatKey[] = [
  'y1993_2003',
  'y2004_2014',
  'y2015_2020',
  'y2021_2022',
  'y2023_2025',
  'y2026_',
  'basic_land',
  'token',
  'foil',
];

export const TAB_LABELS: Record<FormatKey, string> = {
  y1993_2003: '1995〜2003',
  y2004_2014: '2004〜2014',
  y2015_2020: '2015〜2020',
  y2021_2022: '2021〜2022',
  y2023_2025: '2023〜2025',
  y2026_: '2026〜',
  basic_land: 'Basic Land',
  token: 'Token',
  foil: 'Foil',
};

export type ThresholdKey = 'common' | 'uncommon' | 'basicLand' | 'token' | 'foilCommon' | 'foilUncommon';

export const THRESHOLD_OPTIONS: Record<ThresholdKey, { values: number[]; default: number }> = {
  common: {
    values: [0.80, 0.90, 1.00, 1.10, 1.20, 1.30, 1.40, 1.50, 1.60, 1.70, 1.80, 1.90, 2.00],
    default: 0.80,
  },
  uncommon: {
    values: [2.00, 2.10, 2.20, 2.30, 2.40, 2.50, 2.60, 2.70, 2.80, 2.90, 3.00, 3.10, 3.20, 3.30, 3.40, 3.50, 3.60, 3.70, 3.80, 3.90, 4.00],
    default: 2.00,
  },
  basicLand: {
    values: [2.50, 2.60, 2.70, 2.80, 2.90, 3.00, 3.10, 3.20, 3.30, 3.40, 3.50, 3.60, 3.70, 3.80, 3.90, 4.00],
    default: 2.50,
  },
  token: {
    values: [2.50, 2.60, 2.70, 2.80, 2.90, 3.00, 3.10, 3.20, 3.30, 3.40, 3.50, 3.60, 3.70, 3.80, 3.90, 4.00],
    default: 2.50,
  },
  foilCommon: {
    values: [4.50, 5.00, 6.50, 7.00, 8.50, 9.00, 10.00],
    default: 10.00,
  },
  foilUncommon: {
    values: [4.50, 5.00, 6.50, 7.00, 8.50, 9.00, 10.00],
    default: 10.00,
  },
};

export const THRESHOLD_VISIBILITY: Record<string, ThresholdKey[]> = {
  basic_land: ['basicLand'],
  token: ['token'],
  foil: ['foilCommon', 'foilUncommon'],
};

export const DEFAULT_THRESHOLD_KEYS: ThresholdKey[] = ['common', 'uncommon'];

export const THRESHOLD_LABELS: Record<ThresholdKey, string> = {
  common: 'Common Price Threshold:',
  uncommon: 'Uncommon Price Threshold:',
  basicLand: 'Basic Land Price Threshold:',
  token: 'Token Price Threshold:',
  foilCommon: 'Foil Common Price Threshold:',
  foilUncommon: 'Foil Uncommon Price Threshold:',
};
