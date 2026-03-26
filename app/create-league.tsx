// app/create-league.tsx
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

export default function CreateLeague() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const { themeColors } = useTheme();

  const handleCreateLeague = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a league name.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No authenticated user');

      const userId = user.id;
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .insert({
          name: name.trim(),
          created_by: userId,
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (leagueError || !league) throw leagueError;

      const { error: memberError } = await supabase
        .from('league_members')
        .insert({
          league_id: league.id,
          user_id: userId,
        });

      if (memberError) throw memberError;

      router.replace({
        pathname: '/(tabs)/leaderboard',
        params: { leagueId: league.id, inviteCode: league.invite_code },
      });

    } catch (err: any) {
      console.error('CREATE LEAGUE FAILED:', err);
      Alert.alert('Error creating league', err.message);
    } finally {
      setLoading(false);
    }
  };

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
            Create a League
          </Text>

          <TextInput
            placeholder="Enter league name"
            placeholderTextColor={themeColors.text + '66'}
            value={name}
            onChangeText={setName}
            style={[
              styles.input,
              {
                borderColor: themeColors.border,
                color: themeColors.text,
              },
            ]}
          />

          <TouchableOpacity
            onPress={handleCreateLeague}
            disabled={loading}
            style={[
              styles.button,
              { backgroundColor: themeColors.tint, opacity: loading ? 0.6 : 1 },
            ]}
          >
            <Text style={[styles.buttonText, { color: themeColors.background }]}>
              {loading ? 'Creating...' : 'Create League'}
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