import type { Creature } from '../../lib/shared/types';

export const CREATURES: Creature[] = [
  {
    id: 'flower1',
    type: 'flower',
    image: require('../../assets/images/creatures/flower_1.png'),
    label: { ru: 'Цветок', de: 'Blume', uk: 'Квітка', ar: 'زهرة', en: 'Flower' },
    reward: 8,
    cooldown: 3600000,
  },
  {
    id: 'flower2',
    type: 'flower',
    image: require('../../assets/images/creatures/sunflower.png'),
    label: { ru: 'Подсолнух', de: 'Sonnenblume', uk: 'Соняшник', ar: 'عباد الشمس', en: 'Sunflower' },
    reward: 8,
    cooldown: 3600000,
  },
  {
    id: 'animal1',
    type: 'animal',
    image: require('../../assets/images/creatures/fox.png'),
    label: { ru: 'Лисёнок', de: 'Fuchs', uk: 'Лисеня', ar: 'ثعلب', en: 'Fox' },
    reward: 15,
    cooldown: 7200000,
  },
  {
    id: 'animal2',
    type: 'animal',
    image: require('../../assets/images/creatures/turtoise.png'),
    label: { ru: 'Черепашка', de: 'Schildkröte', uk: 'Черепашка', ar: 'سلحفاة', en: 'Turtle' },
    reward: 12,
    cooldown: 7200000,
  },
  {
    id: 'animal3',
    type: 'animal',
    image: require('../../assets/images/creatures/butterfly.png'),
    label: { ru: 'Бабочка', de: 'Schmetterling', uk: 'Метелик', ar: 'فراشة', en: 'Butterfly' },
    reward: 10,
    cooldown: 7200000,
  },
  {
    id: 'codariocalyx',
    type: 'flower',
    image: require('../../assets/images/creatures/desmodium.png'),
    label: { ru: 'Кодариокаликс', de: 'Codariocalyx', uk: 'Кодаріокалікс', ar: 'كوداريوكاليكس', en: 'Codariocalyx' },
    reward: 12,
    cooldown: 5400000,
  },
];
