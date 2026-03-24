import supabase from '@/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

export default function JoinLeague() {
  const [code, setCode] = useState('');
  const router = useRouter();

  async function joinLeague() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { data: league, error } = await supabase
      .from('leagues')
      .select('id')
      .eq('invite_code', code)
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
    router.replace('/(tabs)/leaderboard');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a League</Text>
      <TextInput
        placeholder="Enter league code"
        value={code}
        onChangeText={setCode}
        style={styles.input}
      />
      <Button title="Join League" onPress={joinLeague} />
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