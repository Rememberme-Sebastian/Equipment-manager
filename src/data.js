// Fixed data for the Phoenix Team Manager.
// Edit these lists to change the defaults. Anything changed inside the app is saved on top of them.

export const OPPONENTS = {
  ADL: 'Adelaide United',
  AFC: 'Auckland FC',
  BRI: 'Brisbane Roar',
  CCM: 'Central Coast Mariners',
  MAC: 'Macarthur FC',
  MBC: 'Melbourne City',
  MBV: 'Melbourne Victory',
  NEW: 'Newcastle Jets',
  PER: 'Perth Glory',
  SFC: 'Sydney FC',
  WSW: 'Western Sydney Wanderers',
  TBC: 'Opponent TBC'
};

// From the season schedule. loc: H home, A away, TBC not known yet.
export const DEFAULT_FIXTURES = [
  { id: 'pre1', date: '2026-10-01', round: 'Pre-season', opp: 'NEW', loc: 'A', time: '', note: 'Pre-season friendly' },
  { id: 'pre2', date: '2026-10-10', round: 'Pre-season', opp: 'MAC', loc: 'A', time: '', note: 'Pre-season game in Australia' },
  { id: 'r1', date: '2026-10-18', round: 'RD1', opp: 'MBV', loc: 'H', time: '3pm', note: '' },
  { id: 'r2', date: '2026-10-25', round: 'RD2', opp: 'CCM', loc: 'H', time: '3pm', note: '' },
  { id: 'r3', date: '2026-10-31', round: 'RD3', opp: 'NEW', loc: 'A', time: '3pm', note: '' },
  { id: 'r4', date: '2026-11-07', round: 'RD4', opp: 'AFC', loc: 'A', time: '5pm', note: '' },
  { id: 'r5', date: '2026-11-22', round: 'RD5', opp: 'MAC', loc: 'H', time: '3pm', note: '' },
  { id: 'r7', date: '2026-12-06', round: 'RD7', opp: 'ADL', loc: 'H', time: '3pm', note: '' },
  { id: 'r8', date: '2026-12-13', round: 'RD8', opp: 'WSW', loc: 'A', time: '5pm', note: '' },
  { id: 'r9', date: '2026-12-19', round: 'RD9', opp: 'AFC', loc: 'H', time: '5pm', note: '' },
  { id: 'r10', date: '2026-12-29', round: 'RD10', opp: 'MBV', loc: 'A', time: '7pm', note: '' },
  { id: 'r11', date: '2027-01-02', round: 'RD11', opp: 'NEW', loc: 'H', time: '5pm', note: '' },
  { id: 'r12', date: '2027-01-10', round: 'RD12', opp: 'MBC', loc: 'A', time: '5pm', note: '' },
  { id: 'r13', date: '2027-01-14', round: 'RD13', opp: 'MAC', loc: 'A', time: '7:40pm', note: '' },
  { id: 'r14', date: '2027-01-23', round: 'RD14', opp: 'BRI', loc: 'A', time: '4pm', note: '' },
  { id: 'r15', date: '2027-01-30', round: 'RD15', opp: 'PER', loc: 'H', time: '5pm', note: '' },
  { id: 'r16', date: '2027-02-06', round: 'RD16', opp: 'WSW', loc: 'H', time: '5pm', note: 'Played in Christchurch', occasion: 'away' },
  { id: 'r17', date: '2027-02-13', round: 'RD17', opp: 'AFC', loc: 'A', time: '5pm', note: '' },
  { id: 'tbc1', date: '2027-02-21', round: 'Game TBC', opp: 'TBC', loc: 'TBC', time: '', note: 'Game TBC on the season schedule' },
  { id: 'r19', date: '2027-02-28', round: 'RD19', opp: 'MBC', loc: 'A', time: '4pm', note: '' },
  { id: 'r20', date: '2027-03-06', round: 'RD20', opp: 'SFC', loc: 'H', time: '3pm', note: '' },
  { id: 'r21', date: '2027-03-13', round: 'RD21', opp: 'CCM', loc: 'A', time: '5pm', note: '' },
  { id: 'r22', date: '2027-03-20', round: 'RD22', opp: 'MAC', loc: 'H', time: '5pm', note: '' },
  { id: 'tbc2', date: '2027-03-26', round: 'Game TBC', opp: 'TBC', loc: 'TBC', time: '', note: 'Game TBC in the FIFA international window' },
  { id: 'r23', date: '2027-04-02', round: 'RD23', opp: 'ADL', loc: 'A', time: '7:10pm', note: '' },
  { id: 'r24', date: '2027-04-09', round: 'RD24', opp: 'BRI', loc: 'H', time: '7pm', note: '' },
  { id: 'r25', date: '2027-04-17', round: 'RD25', opp: 'NEW', loc: 'H', time: '5pm', note: '' },
  { id: 'r26', date: '2027-04-24', round: 'RD26', opp: 'MBC', loc: 'H', time: '5pm', note: '' },
  { id: 'r27', date: '2027-04-30', round: 'RD27', opp: 'PER', loc: 'A', time: '7:45pm', note: '' },
  { id: 'r28', date: '2027-05-07', round: 'RD28', opp: 'SFC', loc: 'A', time: '7:40pm', note: '' },
  { id: 'ef', date: '2027-05-15', round: 'Elimination final', opp: 'TBC', loc: 'TBC', time: '', note: 'Saturday 15 or Sunday 16 May' },
  { id: 'sf1', date: '2027-05-22', round: 'Semi final 1', opp: 'TBC', loc: 'TBC', time: '', note: 'Saturday 22 or Sunday 23 May' },
  { id: 'sf2', date: '2027-05-29', round: 'Semi final 2', opp: 'TBC', loc: 'TBC', time: '', note: 'Saturday 29 or Sunday 30 May' },
  { id: 'gf', date: '2027-06-05', round: 'Grand final', opp: 'TBC', loc: 'TBC', time: '', note: 'Saturday 5 or Sunday 6 June' }
];

export const OCCASIONS = [
  { id: 'home', label: 'Home game', hint: 'Game at the stadium. Training at the training ground.' },
  { id: 'homeStadium', label: 'Home game, stadium training', hint: 'MD-1 training is at the stadium.' },
  { id: 'away', label: 'Away game', hint: 'Fly in, play and fly home.' },
  { id: 'awayStay', label: 'Away trip, training there', hint: 'We stay and train in that city.' }
];

export const KITS = [
  { id: 'home', label: 'Home' },
  { id: 'away', label: 'Away' },
  { id: 'third', label: 'Third' }
];

const ALL = ['home', 'homeStadium', 'away', 'awayStay'];
const AWAY = ['away', 'awayStay'];

const items = (prefix, list) => list.map((name, i) => ({ id: `${prefix}-${i + 1}`, name }));

// carrier: 'Players' means it goes into the squad bag allocation. Otherwise a staff member carries it.
// difficulty: 1 is the easiest bag to carry. Players' bags are handed out easiest first.
// {kit} in an item name is swapped for Home, Away or Third.
export const DEFAULT_BAGS = [
  { id: 'mk1', name: 'Match Kit 1', carrier: 'Players', difficulty: 6, trips: ALL, items: items('mk1', ['Speaker and charger', '{kit} match shirts (all sizes)', '{kit} match shorts (all sizes)']) },
  { id: 'mk2', name: 'Match Kit 2 (Warm Up)', carrier: 'Players', difficulty: 5, trips: ALL, items: items('mk2', ['Warm up tops', 'Warm up shirts', 'GPS vests', 'GK warm up top']) },
  { id: 'mk3', name: 'Match Kit 3 (Socks and Skins)', carrier: 'Players', difficulty: 2, trips: ALL, items: items('mk3', ['Sets of yellow socks', 'Sets of pink socks', 'Sets of yellow bottom skins', 'Sets of yellow top skins', 'Sets of pink top skins', 'Sets of pink bottom skins', 'Set of blue bibs', 'Kit man box', 'Captain\'s armband']) },
  { id: 'mk4', name: 'Match Kit 4 (Sub Jackets)', carrier: 'Players', difficulty: 1, trips: ALL, items: items('mk4', ['8 puffa jackets', 'Blood kit (49, 50 and 60 GK)', 'Track suit pants']) },
  { id: 'balls1', name: 'Bag of Balls 1', carrier: 'Players', difficulty: 12, trips: ALL, items: items('balls1', ['Match balls', 'Ball pump', 'Ball needles']) },
  { id: 'balls2', name: 'Bag of Balls 2', carrier: 'Players', difficulty: 12, trips: ALL, items: items('balls2', ['Training balls', 'Spare ball pump', 'Ball repair kit']) },
  { id: 'teb', name: 'Training Equipment Bag', carrier: 'Sebastian Bayliss (Equipment)', difficulty: 0, trips: ['homeStadium', 'awayStay'], items: items('teb', ['All flat markers', 'Ball pump (battery in Canyon)', '40 flat markers', '20 dome cones', 'Set of orange bibs', 'Set of purple bibs', 'Set of blue bibs', 'Sebba\'s boots']) },
  { id: 'poles', name: 'Poles (Red Bag)', carrier: 'Players', difficulty: 3, trips: ['homeStadium', 'away', 'awayStay'], items: items('poles', ['Training poles', 'Pole bases', 'Pole connectors', 'Spare poles']) },
  { id: 'drum', name: 'Blue Drum', carrier: 'Players', difficulty: 4, trips: AWAY, items: [] },
  { id: 'sc1', name: 'S&C 1', carrier: 'Players', difficulty: 7, trips: AWAY, items: [] },
  { id: 'gat', name: 'Gatorade Chilly Bin', carrier: 'Players', difficulty: 8, trips: ALL, items: [] },
  { id: 'grey', name: 'Grey Chilly Bin', carrier: 'Players', difficulty: 9, trips: AWAY, items: [] },
  { id: 'esky2', name: 'Blue Esky 2', carrier: 'Players', difficulty: 10, trips: AWAY, items: [] },
  { id: 'esky1', name: 'Blue Esky 1', carrier: 'Players', difficulty: 11, trips: AWAY, items: [] },
  { id: 'lusl', name: 'Long USL Bag', carrier: 'Players', difficulty: 13, trips: AWAY, items: [] },
  { id: 'scbox', name: 'Black S&C Box', carrier: 'Players', difficulty: 14, trips: AWAY, items: [] },
  { id: 'bed', name: 'Physio Bed', carrier: 'Players', difficulty: 15, trips: AWAY, items: [] },
  { id: 'sc3', name: 'S&C 3', carrier: 'Weijie Lim (Strength and Conditioning)', difficulty: 0, trips: AWAY, items: [] },
  { id: 'sc2', name: 'S&C 2', carrier: 'Dylan Cope (Goalkeeper Coach)', difficulty: 0, trips: AWAY, items: [] },
  { id: 'usl', name: 'USL', carrier: 'Grayson Harwood (Physio)', difficulty: 0, trips: AWAY, items: [] },
  { id: 'abox', name: 'Analysis Box', carrier: 'Analyst', difficulty: 0, trips: AWAY, items: [] }
];

export const STAFF = [
  'Sebastian Bayliss (Equipment)',
  'Weijie Lim (Strength and Conditioning)',
  'Grayson Harwood (Physio)',
  'Dylan Cope (Goalkeeper Coach)',
  'Analyst'
];

const list = (prefix, texts) => texts.map((text, i) => ({ id: `${prefix}${i + 1}`, text }));

export const DEFAULT_SETTINGS = {
  checklists: {
    training: list('tr', ['Training kit set out', 'Towels topped up', 'Balls pumped']),
    firstBack: list('fb', ['Match kit from the game washed', 'Match kit folded', 'Match kit set up for the next game']),
    travel: list('tv', ['Bags packed and ticked off in Bag packs', 'Travel print off done', 'Carry-on items handed out']),
    gameday: list('gd', ['All bags taken to the changing room', 'Match shirts hung up', 'Second shirts out for the starting 11', 'Packs unpacked', 'Signs put up', 'Banners put up', 'Set pieces put up', 'Towels in the right place'])
  },
  carryOns: ['Game Ready', 'Normatec', 'Defib', 'GPS Units']
};

// Squad list from the 18 Nov 2026 sizes sheet.
// seniority: 1 is the most senior. Returning players keep last season's order.
// New signings sit after them in sheet order. Change the order on the Squad tab.
export const PLAYERS = [
  {"id": "alex-rufer", "number": 14, "name": "Alex Rufer", "position": "MF", "group": "First team", "matchShirt": "M", "matchShorts": "L", "warmUpShirt": "M", "warmUpZip": "M", "trainingShorts": "L", "seniority": 1},
  {"id": "kazuki-nagasawa", "number": 25, "name": "Kazuki Nagasawa", "position": "MF", "group": "First team", "matchShirt": "M", "matchShorts": "M", "warmUpShirt": "M", "warmUpZip": "M", "trainingShorts": "M", "seniority": 2},
  {"id": "corban-piper", "number": 99, "name": "Corban Piper", "position": "DF", "group": "First team", "matchShirt": "L", "matchShorts": "XL", "warmUpShirt": "M", "warmUpZip": "L", "trainingShorts": "L", "seniority": 3},
  {"id": "fin-roa-conchie", "number": 6, "name": "Fin Roa Conchie", "position": "MF", "group": "First team", "matchShirt": "M", "matchShorts": "L", "warmUpShirt": "M", "warmUpZip": "M", "trainingShorts": "L", "seniority": 4},
  {"id": "isaac-hughes", "number": 15, "name": "Isaac Hughes", "position": "DF", "group": "First team", "matchShirt": "M", "matchShorts": "L", "warmUpShirt": "M", "warmUpZip": "L", "trainingShorts": "L", "seniority": 5},
  {"id": "matthew-sheridan", "number": 27, "name": "Matthew Sheridan", "position": "DF", "group": "First team", "matchShirt": "M", "matchShorts": "L", "warmUpShirt": "M", "warmUpZip": "M", "trainingShorts": "L", "seniority": 6},
  {"id": "lukas-kelly-heald", "number": 18, "name": "Lukas Kelly-Heald", "position": "DF", "group": "First team", "matchShirt": "M", "matchShorts": "XL", "warmUpShirt": "M", "warmUpZip": "L", "trainingShorts": "XL", "seniority": 7},
  {"id": "alby-kelly-heald", "number": 30, "name": "Alby Kelly-Heald", "position": "GK", "group": "First team", "matchShirt": "M (GK)", "matchShorts": "XL (GK)", "warmUpShirt": "M", "warmUpZip": "L", "trainingShorts": "L (GK)", "seniority": 8},
  {"id": "xuan-loke", "number": 24, "name": "Xuan Loke", "position": "DF", "group": "First team", "matchShirt": "S", "matchShorts": "XL", "warmUpShirt": "S", "warmUpZip": "M", "trainingShorts": "L", "seniority": 9},
  {"id": "nathan-walker", "number": 17, "name": "Nathan Walker", "position": "FW", "group": "First team", "matchShirt": "S", "matchShorts": "L", "warmUpShirt": "S", "warmUpZip": "S", "trainingShorts": "L", "seniority": 10},
  {"id": "jayden-smith", "number": 39, "name": "Jayden Smith", "position": "DF", "group": "First team", "matchShirt": "L", "matchShorts": "XL (L)", "warmUpShirt": "L", "warmUpZip": "L", "trainingShorts": "XL (L)", "seniority": 11},
  {"id": "anaru-cassidy", "number": 37, "name": "Anaru Cassidy", "position": "", "group": "First team", "matchShirt": "M", "matchShorts": "L", "warmUpShirt": "M", "warmUpZip": "M", "trainingShorts": "M", "seniority": 12},
  {"id": "eamonn-mccarron", "number": 40, "name": "Eamonn McCarron", "position": "GK", "group": "First team", "matchShirt": "L (GK)", "matchShorts": "XL (GK)", "warmUpShirt": "L", "warmUpZip": "L", "trainingShorts": "L", "seniority": 13},
  {"id": "walter-scott", "number": 5, "name": "Walter Scott", "position": "", "group": "First team", "matchShirt": "M", "matchShorts": "L", "warmUpShirt": "M", "warmUpZip": "M", "trainingShorts": "L", "seniority": 14},
  {"id": "bryce-duke", "number": 7, "name": "Bryce Duke", "position": "", "group": "First team", "matchShirt": "M", "matchShorts": "L", "warmUpShirt": "M", "warmUpZip": "M", "trainingShorts": "L", "seniority": 15},
  {"id": "max-anderson", "number": 8, "name": "Max Anderson", "position": "", "group": "First team", "matchShirt": "M", "matchShorts": "L", "warmUpShirt": "M", "warmUpZip": "M", "trainingShorts": "L", "seniority": 16},
  {"id": "rafael-duran", "number": 9, "name": "Rafael Durán", "position": "", "group": "First team", "matchShirt": "M", "matchShorts": "L", "warmUpShirt": "M", "warmUpZip": "M", "trainingShorts": "L", "seniority": 17},
  {"id": "riley-bidois", "number": 11, "name": "Riley Bidois", "position": "", "group": "First team", "matchShirt": "M", "matchShorts": "L", "warmUpShirt": "M", "warmUpZip": "M", "trainingShorts": "L", "seniority": 18},
  {"id": "henry-gray", "number": 13, "name": "Henry Gray", "position": "GK", "group": "First team", "matchShirt": "M (GK)", "matchShorts": "XL (GK)", "warmUpShirt": "L", "warmUpZip": "L", "trainingShorts": "XL", "seniority": 19},
  {"id": "james-mcgarry", "number": 23, "name": "James McGarry", "position": "", "group": "First team", "matchShirt": "M", "matchShorts": "M", "warmUpShirt": "L", "warmUpZip": "M", "trainingShorts": "L", "seniority": 20},
  {"id": "bill-tuiloma", "number": 28, "name": "Bill Tuiloma", "position": "", "group": "First team", "matchShirt": "M", "matchShorts": "XL", "warmUpShirt": "L", "warmUpZip": "L", "trainingShorts": "L", "seniority": 21},
  {"id": "ben-trenberth", "number": 32, "name": "Ben Trenberth", "position": "", "group": "First team", "matchShirt": "S", "matchShorts": "M", "warmUpShirt": "S", "warmUpZip": "S", "trainingShorts": "S", "seniority": 22},
  {"id": "dylan-gardiner", "number": 34, "name": "Dylan Gardiner", "position": "", "group": "Academy", "matchShirt": "L", "matchShorts": "L", "warmUpShirt": "L", "warmUpZip": "L", "trainingShorts": "L", "seniority": 23},
  {"id": "ryan-lee", "number": 31, "name": "Ryan Lee", "position": "", "group": "Academy", "matchShirt": "S", "matchShorts": "M", "warmUpShirt": "S", "warmUpZip": "S", "trainingShorts": "S", "seniority": 24},
  {"id": "luke-mitchell", "number": 35, "name": "Luke Mitchell", "position": "", "group": "Academy", "matchShirt": "M", "matchShorts": "M", "warmUpShirt": "M", "warmUpZip": "M", "trainingShorts": "M", "seniority": 25},
  {"id": "mac-munro", "number": 41, "name": "Mac Munro", "position": "", "group": "Academy", "matchShirt": "L", "matchShorts": "L", "warmUpShirt": "", "warmUpZip": "L", "trainingShorts": "L", "seniority": 26},
  {"id": "daniel-nelson", "number": 33, "name": "Daniel Nelson", "position": "", "group": "Academy", "matchShirt": "S", "matchShorts": "M", "warmUpShirt": "", "warmUpZip": "S", "trainingShorts": "S", "seniority": 27},
  {"id": "fletcher-pratt", "number": 36, "name": "Fletcher Pratt", "position": "", "group": "Academy", "matchShirt": "S", "matchShorts": "M", "warmUpShirt": "", "warmUpZip": "S", "trainingShorts": "S", "seniority": 28},
  {"id": "joseph-mcintyre", "number": 38, "name": "Joseph McIntyre", "position": "", "group": "Academy", "matchShirt": "M", "matchShorts": "M", "warmUpShirt": "L", "warmUpZip": "L", "trainingShorts": "L", "seniority": 29},
  {"id": "willem-des-tombe", "number": 39, "name": "Willem Des Tombe", "position": "", "group": "Academy", "matchShirt": "S", "matchShorts": "M", "warmUpShirt": "S", "warmUpZip": "S", "trainingShorts": "S", "seniority": 30},
  {"id": "joseph-chalabi", "number": 50, "name": "Joseph Chalabi", "position": "GK", "group": "Academy", "matchShirt": "L (GK)", "matchShorts": "L (GK)", "warmUpShirt": "", "warmUpZip": "L", "trainingShorts": "L", "seniority": 31},
  {"id": "kyle-koch", "number": 42, "name": "Kyle Koch", "position": "", "group": "Academy", "matchShirt": "M", "matchShorts": "M", "warmUpShirt": "", "warmUpZip": "M", "trainingShorts": "M", "seniority": 32},
  {"id": "zach-cashmore", "number": 43, "name": "Zach Cashmore", "position": "", "group": "Academy", "matchShirt": "", "matchShorts": "", "warmUpShirt": "", "warmUpZip": "", "trainingShorts": "", "seniority": 33}
];

export const UNIFORM_LABELS = {
  matchShirt: 'Match shirts',
  matchShorts: 'Match shorts',
  warmUpShirt: 'Warm up shirts',
  warmUpZip: 'Warm up 1/4 zips',
  trainingShorts: 'Training shorts'
};

export const SESSION_CODES = [
  ['TT', 'Team training'],
  ['GYM', 'Gym session'],
  ['BIKE', 'Bike session'],
  ['REC/TT', 'Recovery, or training for those who did not play'],
  ['OFF', 'Day off'],
  ['TRAVEL', 'Travel day'],
  ['TT/TRAVEL', 'Train, then travel']
];
