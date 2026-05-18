import { useAuth } from '@/lib/auth/AuthContext';
import { AuthLoginError } from '@/lib/api/authLogin';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const onSubmit = useCallback(async () => {
    setErrorKey(null);
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setErrorKey('invalid_email');
      return;
    }
    if (password.length < 6) {
      setErrorKey('short_password');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(trimmed, password);
    } catch (e) {
      if (e instanceof AuthLoginError) {
        if (e.message === 'missing_api_url' || e.status === 0) {
          setErrorKey('missing_api');
        } else if (e.status === 401 || e.status === 403) {
          setErrorKey('bad_credentials');
        } else if (e.message === 'invalid_response') {
          setErrorKey('unknown');
        } else {
          setErrorKey('unknown');
        }
      } else {
        setErrorKey('network');
      }
    } finally {
      setSubmitting(false);
    }
  }, [email, password, signIn]);

  const errorText =
    errorKey === 'invalid_email'
      ? t.authErrorInvalidEmail
      : errorKey === 'short_password'
        ? t.authErrorShortPassword
        : errorKey === 'missing_api'
          ? t.authErrorMissingApiUrl
          : errorKey === 'bad_credentials'
            ? t.authErrorBadCredentials
            : errorKey === 'network'
              ? t.authErrorNetwork
              : errorKey
                ? t.authErrorUnknown
                : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.inner}>
          <Text style={[styles.title, { color: palette.text }]}>{t.authTitle}</Text>
          <Text style={[styles.subtitle, { color: palette.icon }]}>{t.authSubtitle}</Text>

          <Text style={[styles.label, { color: palette.text }]}>{t.authEmailLabel}</Text>
          <TextInput
            style={[styles.input, { color: palette.text, borderColor: palette.icon }]}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            editable={!submitting}
          />

          <Text style={[styles.label, { color: palette.text }]}>{t.authPasswordLabel}</Text>
          <TextInput
            style={[styles.input, { color: palette.text, borderColor: palette.icon }]}
            secureTextEntry
            textContentType="password"
            value={password}
            onChangeText={setPassword}
            editable={!submitting}
          />

          {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

          <Pressable
            style={[styles.button, { opacity: submitting ? 0.6 : 1 }]}
            onPress={() => void onSubmit()}
            disabled={submitting}
          >
            {submitting ? (
              <View style={styles.buttonBusy}>
                <ActivityIndicator color="#0c120c" />
                <Text style={styles.buttonLabel}>{t.authSigningIn}</Text>
              </View>
            ) : (
              <Text style={styles.buttonLabel}>{t.authSignIn}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', marginTop: 10, marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    marginBottom: 16,
    fontSize: 16,
  },
  error: {
    color: '#c44',
    textAlign: 'center',
    marginBottom: 14,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#5aad6a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonBusy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonLabel: { fontSize: 17, fontWeight: '700', color: '#0c120c' },
});
