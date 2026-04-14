import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Category = 'all' | 'outdoor' | 'home';

type Props = {
  category: Category;
  onChange: (category: Category) => void;
  labels: {
    all: string;
    outdoor: string;
    home: string;
  };
};

export default function CategoryTabs({ category, onChange, labels }: Props) {
  return (
    <View style={styles.catRow}>
      {(['all', 'outdoor', 'home'] as const).map((cat) => (
        <TouchableOpacity
          key={cat}
          style={[styles.catBtn, category === cat && styles.catBtnActive]}
          onPress={() => onChange(cat)}
        >
          <Text style={[styles.catText, category === cat && styles.catTextActive]}>
            {cat === 'all'
              ? `🌍 ${labels.all}`
              : cat === 'outdoor'
              ? `🗺️ ${labels.outdoor}`
              : `🏠 ${labels.home}`}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  catRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  catBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e3020',
    alignItems: 'center',
  },
  catBtnActive: {
    backgroundColor: '#1e3020',
    borderColor: '#3d8b52',
  },
  catText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  catTextActive: {
    color: '#5aad6a',
    fontWeight: '500',
  },
});