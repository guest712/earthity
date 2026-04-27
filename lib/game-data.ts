import { Quest, Creature } from './shared/types';


export const QUESTS: Quest[] = [
  { id: 1, title: { ru: 'Стакан у скамейки', de: 'Becher bei der Bank', uk: 'Стакан біля лавки', ar: 'كوب عند المقعد', en: 'Cup by the bench' }, desc: { ru: 'Парк рядом', de: 'Park nebenan', uk: 'Парк поруч', ar: 'الحديقة', en: 'Nearby park' }, reward: 15, emoji: '🥤', type: 'trash' },
  { id: 2, title: { ru: 'Пакет у урны', de: 'Tüte am Mülleimer', uk: 'Пакет біля урни', ar: 'كيس عند السلة', en: 'Bag by the bin' }, desc: { ru: 'Главная улица', de: 'Hauptstraße', uk: 'Головна вулиця', ar: 'الشارع الرئيسي', en: 'Main street' }, reward: 20, emoji: '🛍', type: 'trash' },
  { id: 3, title: { ru: 'Помочь донести сумку', de: 'Tasche tragen helfen', uk: 'Допомогти нести сумку', ar: 'مساعدة في حمل الحقيبة', en: 'Help carry bags' }, desc: { ru: 'Рядом с метро', de: 'U-Bahn-Nähe', uk: 'Біля метро', ar: 'بالقرب من المترو', en: 'Near metro' }, reward: 40, emoji: '🤝', type: 'help' },
  { id: 4, title: { ru: 'Бутылки у входа', de: 'Flaschen am Eingang', uk: 'Пляшки біля входу', ar: 'زجاجات عند المدخل', en: 'Bottles at entrance' }, desc: { ru: 'Центральная площадь', de: 'Zentralplatz', uk: 'Центральна площа', ar: 'الساحة المركزية', en: 'Central square' }, reward: 25, emoji: '🍾', type: 'trash' },
  { id: 5, title: { ru: 'Вынести мусор', de: 'Müll rausbringen', uk: 'Винести сміття', ar: 'إخراج القمامة', en: 'Take out trash' }, desc: { ru: 'Домашний квест', de: 'Heimquest', uk: 'Домашнє завдання', ar: 'مهمة منزلية', en: 'Home quest' }, reward: 5, emoji: '🗑️', type: 'home' },
  { id: 6, title: { ru: 'Полить цветы', de: 'Blumen gießen', uk: 'Полити квіти', ar: 'سقي الزهور', en: 'Water the plants' }, desc: { ru: 'Домашний квест', de: 'Heimquest', uk: 'Домашнє завдання', ar: 'مهمة منزلية', en: 'Home quest' }, reward: 5, emoji: '🌸', type: 'home' },
  { id: 7, title: { ru: 'Спортивные упражнения', de: 'Sport machen', uk: 'Спортивні вправи', ar: 'تمارين رياضية', en: 'Exercise' }, desc: { ru: 'Домашний квест', de: 'Heimquest', uk: 'Домашнє завдання', ar: 'مهمة منزلية', en: 'Home quest' }, reward: 8, emoji: '💪', type: 'home' },
  { id: 8, title: { ru: 'Нарисовать что-нибудь', de: 'Etwas zeichnen', uk: 'Намалювати щось', ar: 'رسم شيء ما', en: 'Draw something' }, desc: { ru: 'Для творцов', de: 'Für Kreative', uk: 'Для творців', ar: 'للمبدعين', en: 'For creators' }, reward: 10, emoji: '🎨', type: 'home' },
  { id: 9, title: { ru: 'Не накричать на питомца', de: 'Nicht auf Haustier schreien', uk: 'Не накричати на улюбленця', ar: 'عدم الصراخ على الحيوان', en: 'Be kind to your pet' }, desc: { ru: 'Ахимса дома', de: 'Ahimsa zuhause', uk: 'Ахімса вдома', ar: 'أهيمسا في المنزل', en: 'Ahimsa at home' }, reward: 15, emoji: '🐾', type: 'home' },
  { id: 10, title: { ru: 'Отсортировать мусор', de: 'Müll sortieren', uk: 'Відсортувати сміття', ar: 'فرز القمامة', en: 'Sort the recycling' }, desc: { ru: 'Домашний квест', de: 'Heimquest', uk: 'Домашнє завдання', ar: 'مهمة منزلية', en: 'Home quest' }, reward: 8, emoji: '♻️', type: 'home' },
  { id: 11, title: { ru: 'Тест', de: 'Test', uk: 'Тест', ar: 'اختبار', en: 'Test' }, desc: { ru: 'Тестовый квест', de: 'Testquest', uk: 'Тестовий квест', ar: 'مهمة اختبار', en: 'Test quest' }, reward: 1, emoji: '🧪', type: 'test' },
];
export const CREATURES: Creature[] = [
  { id: 'flower1', type: 'flower', group: 'flora_flower', image: require('../assets/images/creatures/flower_1.png'), label: { ru: 'Цветок', de: 'Blume', uk: 'Квітка', ar: 'زهرة', en: 'Flower' }, reward: 8, cooldown: 3600000 },
  { id: 'flower2', type: 'flower', group: 'flora_seed', image: require('../assets/images/creatures/sunflower.png'), label: { ru: 'Подсолнух', de: 'Sonnenblume', uk: 'Соняшник', ar: 'عباد الشمس', en: 'Sunflower' }, reward: 8, cooldown: 3600000 },
  { id: 'animal1', type: 'animal', group: 'mammal', image: require('../assets/images/creatures/fox.png'), label: { ru: 'Лисёнок', de: 'Fuchs', uk: 'Лисеня', ar: 'ثعلب', en: 'Fox' }, reward: 15, cooldown: 7200000 },
  { id: 'animal2', type: 'animal', group: 'reptile', image: require('../assets/images/creatures/turtoise.png'), label: { ru: 'Черепашка', de: 'Schildkröte', uk: 'Черепашка', ar: 'سلحفاة', en: 'Turtle' }, reward: 12, cooldown: 7200000 },
  { id: 'animal3', type: 'animal', group: 'insect', image: require('../assets/images/creatures/butterfly.png'), label: { ru: 'Бабочка', de: 'Schmetterling', uk: 'Метелик', ar: 'فراشة', en: 'Butterfly' }, reward: 10, cooldown: 7200000 },
  { id: 'codariocalyx', type: 'flower', group: 'flora_seed', image: require('../assets/images/creatures/desmodium.png'), label: { ru: 'Кодариокаликс', de: 'Codariocalyx', uk: 'Кодаріокалікс', ar: 'كوداريوكاليكس', en: 'Codariocalyx' }, reward: 12, cooldown: 5400000 },
];

export const WATER_SPOTS = [
  { id: 'water1' },
  { id: 'water2' },
  { id: 'water3' },
];

export const FEED_SPOTS = [
  { id: 'feed1' },
  { id: 'feed2' },
  { id: 'feed3' },
];

export const TRASH_SPOTS = [
  { id: 'trash1', type: 'plastic' },
  { id: 'trash2', type: 'glass' },
  { id: 'trash3', type: 'paper' },
];

export const MINDFUL_PHRASES = [
  { ru: 'Этот мусор лежит здесь потому что кто-то решил что земля — его мусорное ведро. Ты думаешь иначе.', en: 'This litter is here because someone decided the earth is their bin. You think differently.', de: 'Dieser Müll liegt hier, weil jemand die Erde als seine Mülltonne betrachtet. Du denkst anders.', uk: 'Це сміття тут тому що хтось вирішив що земля — його смітник. Ти думаєш інакше.', ar: 'هذه القمامة هنا لأن شخصاً ما قرر أن الأرض سلة مهملاته. أنت تفكر بشكل مختلف.' },
  { ru: 'Каждый убранный предмет — это существо которое не отравится. Спасибо тебе.', en: 'Every piece of litter removed is a creature that won\'t be poisoned. Thank you.', de: 'Jedes aufgehobene Stück ist ein Lebewesen das nicht vergiftet wird. Danke.', uk: 'Кожен прибраний предмет — це істота яка не отруїться. Дякую тобі.', ar: 'كل قطعة تُزال هي مخلوق لن يُسمَّم. شكراً لك.' },
  { ru: 'Ты только что сделал мир чуть чище для кого-то кто ещё не родился.', en: 'You just made the world a little cleaner for someone not yet born.', de: 'Du hast die Welt gerade etwas sauberer gemacht für jemanden der noch nicht geboren ist.', uk: 'Ти щойно зробив світ трохи чистішим для когось хто ще не народився.', ar: 'لقد جعلت العالم أكثر نظافة قليلاً لشخص لم يولد بعد.' },
  { ru: 'Небольшое действие. Большое значение. Ахимса в действии.', en: 'Small action. Big meaning. Ahimsa in action.', de: 'Kleine Handlung. Große Bedeutung. Ahimsa in Aktion.', uk: 'Маленька дія. Велике значення. Ахімса в дії.', ar: 'فعل صغير. معنى كبير. أهيمسا في العمل.' },
  { ru: 'Природа не просит о помощи словами. Она просит действиями.', en: 'Nature doesn\'t ask for help with words. It asks through actions.', de: 'Die Natur bittet nicht mit Worten um Hilfe. Sie bittet durch Handlungen.', uk: 'Природа не просить допомоги словами. Вона просить діями.', ar: 'الطبيعة لا تطلب المساعدة بالكلمات. تطلبها من خلال الأفعال.' },
];