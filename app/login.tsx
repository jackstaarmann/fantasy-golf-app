import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme
} from 'react-native';
import { Colors } from '../constants/theme';
import { useAuth } from './providers/AuthProvider';

export default function LoginScreen() {
  const router = useRouter();
  const { supabase } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function playGolfSound() {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/images/sounds/golf-hit.mp3')   // correct path
    );
    await sound.playAsync();
  }

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      Alert.alert('Login failed', error.message);
    } else if (data.session) {
      await playGolfSound();   // play sound on success
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>

      {/* App Icon */}
      <Image 
        source={require('../assets/images/Swing.png')}
        style={styles.icon}
      />

      {/* Branded Title */}
      <Text style={[styles.title, { color: themeColors.text }]}>
        Swing by Staarmann
      </Text>

      {/* Tagline */}
      <Text style={[styles.subtitle, { color: themeColors.text }]}>
        By a golf fan for golf fans.
      </Text>

      {/* Email Input */}
      <TextInput
        placeholder="Email"
        placeholderTextColor={themeColors.text}
        value={email}
        onChangeText={setEmail}
        style={[styles.input, { borderColor: themeColors.text, color: themeColors.text }]}
        keyboardType="email-address"
      />

      {/* Password Input */}
      <TextInput
        placeholder="Password"
        placeholderTextColor={themeColors.text}
        value={password}
        onChangeText={setPassword}
        style={[styles.input, { borderColor: themeColors.text, color: themeColors.text }]}
        secureTextEntry
      />

      {/* Login Button */}
      <TouchableOpacity
        style={[styles.loginButton, { backgroundColor: themeColors.tint }]}
        onPress={handleLogin}
      >
        <Text style={[styles.loginButtonText, { color: themeColors.background }]}>
          Login
        </Text>
      </TouchableOpacity>

      {/* Signup Link */}
      <Text style={[styles.signupText, { color: themeColors.text }]}>
        Don’t have an account?
        <Text 
          style={[styles.signupLink, { color: themeColors.tint }]}
          onPress={() => router.push('/signup')}
        >
          {"  "}Create one
        </Text>
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  icon: {
    width: 110,
    height: 110,
    marginBottom: 10,
  },
  title: { 
    fontSize: 28, 
    marginBottom: 4, 
    fontWeight: 'bold' 
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    opacity: 0.8,
  },
  input: { 
    width: '100%', 
    borderWidth: 1, 
    borderRadius: 8, 
    padding: 10, 
    marginBottom: 10 
  },
  loginButton: { 
    paddingVertical: 15, 
    paddingHorizontal: 30, 
    borderRadius: 8, 
    marginTop: 10, 
    width: '100%' 
  },
  loginButtonText: { 
    fontSize: 18, 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  signupText: {
    marginTop: 20,
    fontSize: 14,
  },
  signupLink: {
    fontWeight: '700',
  },
});