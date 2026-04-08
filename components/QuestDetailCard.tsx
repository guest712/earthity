import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  selected: any;
  lang: string;
  rewardLabel: string;
  howLabel: string;
  doneLabel: string;
  backLabel: string;
  confirmLabel: string;
  yesLabel: string;
  noLabel: string;
  mindfulPhrase: string;
  steps: string[];
  confirming: boolean;
  showConfirmBtn: boolean;
  onPressComplete: () => void;
  onPressConfirmYes: () => void;
  onPressConfirmNo: () => void;
  onPressBack: () => void;
};

export default function QuestDetailCard({
  selected,
  lang,
  rewardLabel,
  howLabel,
  doneLabel,
  backLabel,
  confirmLabel,
  yesLabel,
  noLabel,
  mindfulPhrase,
  steps,
  confirming,
  showConfirmBtn,
  onPressComplete,
  onPressConfirmYes,
  onPressConfirmNo,
  onPressBack,
}: Props) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailEmoji}>{selected.emoji}</Text>
      <Text style={styles.detailTitle}>{selected.title[lang]}</Text>
      <Text style={styles.detailDesc}>{selected.desc[lang]}</Text>
      <Text style={styles.detailReward}>🪙 +{selected.reward} {rewardLabel}</Text>

      <View style={styles.mindfulBox}>
        <Text style={styles.mindfulText}>{mindfulPhrase}</Text>
      </View>

      <View style={styles.steps}>
        <Text style={styles.stepsLabel}>{howLabel}</Text>
        {steps.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {!confirming ? (
        <TouchableOpacity
          style={[styles.btnComplete, !showConfirmBtn && { opacity: 0.3 }]}
          onPress={onPressComplete}
        >
          <Text style={styles.btnCompleteText}>{doneLabel}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.confirmRow}>
          <Text style={styles.confirmText}>{confirmLabel}</Text>
          <View style={styles.confirmBtns}>
            <TouchableOpacity style={styles.btnNo} onPress={onPressConfirmNo}>
              <Text style={styles.btnNoText}>{noLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnYes} onPress={onPressConfirmYes}>
              <Text style={styles.btnYesText}>{yesLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.btnBack} onPress={onPressBack}>
        <Text style={styles.btnBackText}>{backLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  detail: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  detailEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 22,
    color: '#e8e4d8',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 6,
  },
  detailDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 14,
  },
  detailReward: {
    fontSize: 17,
    color: '#e8c97a',
    fontWeight: '600',
    marginBottom: 20,
  },
  mindfulBox: {
    backgroundColor: 'rgba(45,106,63,0.08)',
    borderLeftWidth: 2,
    borderLeftColor: '#3d8b52',
    borderRadius: 4,
    padding: 14,
    marginBottom: 20,
    width: '100%',
  },
  mindfulText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  steps: {
    width: '100%',
    marginBottom: 24,
  },
  stepsLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(90,173,106,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 11,
    color: '#5aad6a',
    fontWeight: '600',
  },
  stepText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  btnComplete: {
    backgroundColor: '#2d6a3f',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 10,
  },
  btnCompleteText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmRow: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
  },
  confirmBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  btnNo: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e3020',
  },
  btnNoText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  btnYes: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#2d6a3f',
  },
  btnYesText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  btnBack: {
    padding: 12,
  },
  btnBackText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
});