import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';
import { COLORS } from '@/lib/constants';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';

type RegisterField = {
  label: string;
  value: string;
  setter: (value: string) => void;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
};

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, loginWithGoogle, isLoading, error, clearError } = useAuthStore();
  const { showToast } = useToast();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !username || !email || !password) {
      showToast({ type: 'error', title: 'Missing details', message: 'All fields are required.' });
      return;
    }
    if (password.length < 8) {
      showToast({ type: 'error', title: 'Weak password', message: 'Password must be at least 8 characters.' });
      return;
    }

    try {
      await register({ name, username, email, password });
      router.replace('/complete-profile');
    } catch (err) {
      showToast({ type: 'error', title: 'Registration failed', message: err instanceof Error ? err.message : 'Please try again.' });
    }
  };


  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      router.replace('/complete-profile');
    } catch (err) {
      showToast({ type: 'error', title: 'Google sign-up failed', message: err instanceof Error ? err.message : 'Please try again.' });
    }
  };

  const fields: RegisterField[] = [
    { label: 'Full Name', value: name, setter: setName, autoCapitalize: 'words' },
    { label: 'Username', value: username, setter: setUsername, autoCapitalize: 'none' },
    {
      label: 'Email',
      value: email,
      setter: setEmail,
      autoCapitalize: 'none',
      keyboardType: 'email-address',
    },
    { label: 'Password', value: password, setter: setPassword, secureTextEntry: true },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}>
          <View style={styles.logoIcon} />
          <Text style={styles.logoText}>ping</Text>
        </View>
        <Text style={styles.subtitle}>Create your account</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {fields.map((field) => (
          <TextInput
            key={field.label}
            style={styles.input}
            placeholder={field.label}
            placeholderTextColor={COLORS.muted}
            autoCapitalize={field.autoCapitalize ?? 'none'}
            keyboardType={field.keyboardType ?? 'default'}
            secureTextEntry={field.secureTextEntry ?? false}
            value={field.value}
            onChangeText={(text) => {
              clearError();
              field.setter(text);
            }}
          />
        ))}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.googleButton} onPress={handleGoogle} disabled={isLoading}>
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.loginLink}>Log in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60 },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginRight: 8,
  },
  logoText: { fontSize: 32, fontWeight: '800', color: COLORS.primary },
  subtitle: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginBottom: 32,
    fontSize: 16,
  },
  errorBox: {
    backgroundColor: COLORS.errorBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: COLORS.error, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.muted, marginHorizontal: 12, fontSize: 13 },
  googleButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  googleText: { color: COLORS.text, fontWeight: '600', fontSize: 15 },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { color: COLORS.textSecondary, fontSize: 14 },
  loginLink: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
});
