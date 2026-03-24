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

export default function SignupScreen() {
  const router = useRouter();
  const { supabase } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSignup = async () => {
    if (password !== confirm) {
      Alert.alert('Passwords do not match');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert('Signup failed', error.message);
    } else if (data.user) {
      Alert.alert('Success', 'Account created. Please log in.');
      router.replace('/login');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>

      {/* App Icon */}
      <Image 
        source={require('../assets/images/Swing.png')}
        style={styles.icon}
      />

      {/* Title */}
      <Text style={[styles.title, { color: themeColors.text }]}>
        Create Account
      </Text>

      {/* Tagline */}
      <Text style={[styles.subtitle, { color: themeColors.text }]}>
        Join Swing by Staarmann
      </Text>

      {/* Email */}
      <TextInput
        placeholder="Email"
        placeholderTextColor={themeColors.text}
        value={email}
        onChangeText={setEmail}
        style={[
          styles.input, 
          { borderColor: themeColors.text, color: themeColors.text }
        ]}
        keyboardType="email-address"
      />

      {/* Password */}
      <TextInput
        placeholder="Password"
        placeholderTextColor={themeColors.text}
        value={password}
        onChangeText={setPassword}
        style={[
          styles.input, 
          { borderColor: themeColors.text, color: themeColors.text }
        ]}
        secureTextEntry
      />

      {/* Confirm Password */}
      <TextInput
        placeholder="Confirm Password"
        placeholderTextColor={themeColors.text}
        value={confirm}
        onChangeText={setConfirm}
        style={[
          styles.input, 
          { borderColor: themeColors.text, color: themeColors.text }
        ]}
        secureTextEntry
      />

      {/* Signup Button */}
      <TouchableOpacity
        style={[styles.signupButton, { backgroundColor: themeColors.tint }]}
        onPress={handleSignup}
      >
        <Text style={[styles.signupButtonText, { color: themeColors.background }]}>
          Create Account
        </Text>
      </TouchableOpacity>

      {/* Login Link */}
      <Text style={[styles.loginText, { color: themeColors.text }]}>
        Already have an account?
        <Text 
          style={[styles.loginLink, { color: themeColors.tint }]}
          onPress={() => router.push('/login')}
        >
          {"  "}Log in
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
  signupButton: { 
    paddingVertical: 15, 
    paddingHorizontal: 30, 
    borderRadius: 8, 
    marginTop: 10, 
    width: '100%' 
  },
  signupButtonText: { 
    fontSize: 18, 
    fontWeight: '600', 
    textAlign: 'center' 
  },
  loginText: {
    marginTop: 20,
    fontSize: 14,
  },
  loginLink: {
    fontWeight: '700',
  },
});