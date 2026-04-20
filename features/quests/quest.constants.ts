import { Quest } from '../../lib/shared/types';

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

  {
    id: 20,
    title: { ru: 'По лисьим следам', en: 'Fox Trails', de: 'Fuchsspuren', uk: 'Лисячими стежками', ar: 'على آثار الثعلب' },
    desc:  { ru: 'Найди следы дикой природы рядом', en: 'Find wildlife signs nearby', de: 'Wildtierspuren suchen', uk: 'Знайди сліди дикої природи', ar: 'ابحث عن علامات الحياة البرية' },
    reward: 50, emoji: '🦊', type: 'help',
    unlockedBy: { dropId: 'wool', amount: 2 },
  },
  {
    id: 21,
    title: { ru: 'Лепестковый путь', en: 'Petal Path', de: 'Blütenweg', uk: 'Пелюстковий шлях', ar: 'درب البتلات' },
    desc:  { ru: 'Убери мусор с цветочной клумбы', en: 'Clean up around a flower bed', de: 'Blumenbeet säubern', uk: 'Прибери сміття навколо клумби', ar: 'نظّف المنطقة حول حديقة الزهور' },
    reward: 40, emoji: '🌸', type: 'trash',
    unlockedBy: { dropId: 'petal', amount: 2 },
  },
  {
    id: 22,
    title: { ru: 'Черепашья тропа', en: 'Turtle Trail', de: 'Schildkrötenpfad', uk: 'Черепаша стежка', ar: 'درب السلحفاة' },
    desc:  { ru: 'Медленная осознанная прогулка', en: 'Slow mindful walk outside', de: 'Achtsamer Spaziergang', uk: 'Повільна усвідомлена прогулянка', ar: 'مشية هادئة واعية في الخارج' },
    reward: 45, emoji: '🐢', type: 'help',
    unlockedBy: { dropId: 'scale', amount: 2 },
  },
];