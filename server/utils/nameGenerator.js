const { uniqueNamesGenerator, adjectives, colors, animals, starWars, names } = require('unique-names-generator');

// Custom word lists for more fun anonymous names
const mysticalCreatures = [
  'Phoenix', 'Dragon', 'Griffin', 'Unicorn', 'Sphinx', 'Kraken', 'Hydra',
  'Chimera', 'Centaur', 'Minotaur', 'Basilisk', 'Cerberus', 'Pegasus',
  'Leviathan', 'Werewolf', 'Vampire', 'Elf', 'Dwarf', 'Goblin', 'Troll',
  'Titan', 'Oracle', 'Specter', 'Phantom', 'Shadow', 'Ghost', 'Spirit',
  'Raven', 'Wolf', 'Falcon', 'Eagle', 'Hawk', 'Viper', 'Cobra', 'Panther',
  'Jaguar', 'Tiger', 'Lion', 'Bear', 'Fox', 'Owl', 'Lynx', 'Puma'
];

const coolAdjectives = [
  'Mystic', 'Silent', 'Cosmic', 'Neon', 'Cyber', 'Shadow', 'Crystal',
  'Thunder', 'Frost', 'Storm', 'Dark', 'Bright', 'Solar', 'Lunar',
  'Stellar', 'Quantum', 'Nova', 'Astral', 'Crimson', 'Azure', 'Golden',
  'Silver', 'Iron', 'Steel', 'Arctic', 'Blazing', 'Electric', 'Sonic',
  'Turbo', 'Ultra', 'Mega', 'Hyper', 'Rapid', 'Swift', 'Bold', 'Brave',
  'Fierce', 'Wild', 'Rogue', 'Stealthy', 'Noble', 'Royal', 'Ancient'
];

const generateAnonymousName = () => {
  const name = uniqueNamesGenerator({
    dictionaries: [coolAdjectives, mysticalCreatures],
    separator: '',
    style: 'capital',
    length: 2
  });

  // Append a random number for extra uniqueness
  const randomNum = Math.floor(Math.random() * 9999) + 1;
  return `${name}${randomNum}`;
};

module.exports = { generateAnonymousName };
