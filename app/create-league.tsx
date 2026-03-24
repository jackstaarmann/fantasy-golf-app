// app/create-league.tsx
import supabase from '@/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

export default function CreateLeague() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateLeague = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a league name.');
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Get the authenticated user (RELIABLE — avoids hydration issues)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No authenticated user');

      const userId = user.id;

      // 2️⃣ Generate invite code
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      console.log("INSERT PAYLOAD:", {
        name,
        created_by: userId,
      });
      const { data: { session } } = await supabase.auth.getSession();
      console.log("ACCESS TOKEN:", session?.access_token);


      // 3️⃣ Insert into leagues
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

      // 4️⃣ Insert into league_members
      const { error: memberError } = await supabase
        .from('league_members')
        .insert({
          league_id: league.id,
          user_id: userId,
        });

      if (memberError) throw memberError;

      // 5️⃣ Navigate
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
    <View style={styles.container}>
      <Text style={styles.title}>Create a League</Text>
      <TextInput
        placeholder="Enter league name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <Button title="Create League" onPress={handleCreateLeague} disabled={loading} />
      <View style={{ height: 12 }} />
      <Button title="Back" onPress={() => router.back()} color="#888" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, padding: 12, marginBottom: 16, borderRadius: 6 },
});