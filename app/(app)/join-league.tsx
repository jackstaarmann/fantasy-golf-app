import { useTheme } from "@/app/providers/ThemeProvider";
import supabase from '@/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JoinLeague() {
  const [code, setCode] = useState('');
  const router = useRouter();

  const { themeColors } = useTheme();

  async function joinLeague() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { data: league, error } = await supabase
      .from('leagues')
      .select('id')
      .eq('invite_code', code.trim().toUpperCase())
      .single();

    if (error || !league) {
      Alert.alert('Invalid Code', 'Please enter a valid league code.');
      return;
    }

    await supabase.from('league_members').insert({
      league_id: league.id,
      user_id: user.id,
    });

    Alert.alert('Success!', 'You joined the league.');
    router.replace('/(app)/(tabs)/leaderboard');
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <View style={styles.container}>
        <View
          style={[
            styles.card,
            { backgroundColor: themeColors.card, borderColor: themeColors.border },
          ]}
        >
          <Text style={[styles.title, { color: themeColors.text }]}>
            Join a League
          </Text>

          <TextInput
            placeholder="Enter league code"
            placeholderTextColor={themeColors.text + '66'}
            autoCapitalize="characters"
            value={code}
            onChangeText={setCode}
            style={[
              styles.input,
              {
                borderColor: themeColors.border,
                color: themeColors.text,
              },
            ]}
          />

          <TouchableOpacity
            onPress={joinLeague}
            style={[styles.button, { backgroundColor: themeColors.tint }]}
          >
            <Text style={[styles.buttonText, { color: themeColors.background }]}>
              Join League
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.button,
              { backgroundColor: themeColors.border, marginTop: 10 },
            ]}
          >
            <Text style={[styles.buttonText, { color: themeColors.text }]}>
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    borderRadius: 6,
    fontSize: 16,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
  },
});