import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../providers/AuthProvider';

// Timezone list (uses Intl if available)
const TIMEZONES = Intl.supportedValuesOf
  ? Intl.supportedValuesOf('timeZone')
  : [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Tokyo',
    ];

export default function ProfileScreen() {
  const { supabase } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [teamName, setTeamName] = useState('');
  const [timezone, setTimezone] = useState('');

  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [timezoneModalVisible, setTimezoneModalVisible] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState('');

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setTeamName(data.team_name || '');
        setTimezone(data.timezone || '');
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  // Save profile with team name uniqueness check
  const saveProfile = async () => {
    if (!profile) return;

    setErrorMessage('');
    setSuccessMessage('');

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('team_name', teamName)
      .neq('id', profile.id)
      .maybeSingle();

    if (existing) {
      setErrorMessage('Team name is already taken.');
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({
        team_name: teamName,
        timezone: timezone || null,
      })
      .eq('id', profile.id);

    if (error) {
      setErrorMessage('Failed to save profile.');
      return;
    }

    setSuccessMessage('Profile updated.');
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profile.email}</Text>

        <Text style={styles.label}>Team Name</Text>
        <TextInput
          style={[
            styles.input,
            {
              color: '#000',
            },
          ]}
          value={teamName}
          onChangeText={setTeamName}
          placeholder="Enter your team name"
          placeholderTextColor="#00000055"
        />

        {/* Timezone Selector */}
        <Text style={styles.label}>Timezone</Text>

        <TouchableOpacity
          style={[
            styles.input,
            {
              justifyContent: 'center',
            },
          ]}
          onPress={() => setTimezoneModalVisible(true)}
        >
          <Text style={{ color: timezone ? '#000' : '#00000055' }}>
            {timezone || 'Select your timezone'}
          </Text>
        </TouchableOpacity>

        {/* Inline validation */}
        {errorMessage !== '' && (
          <Text style={styles.inlineError}>{errorMessage}</Text>
        )}

        {successMessage !== '' && (
          <Text style={styles.inlineSuccess}>{successMessage}</Text>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
          <Text style={styles.saveText}>Save Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Timezone Modal */}
      {timezoneModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Timezone</Text>

            <TextInput
              style={styles.modalSearch}
              placeholder="Search..."
              placeholderTextColor="#00000055"
              value={timezoneSearch}
              onChangeText={setTimezoneSearch}
            />

            <ScrollView style={{ flex: 1 }}>
              {TIMEZONES.filter((tz) =>
                tz.toLowerCase().includes(timezoneSearch.toLowerCase())
              )
                .slice(0, 80)
                .map((tz) => (
                  <TouchableOpacity
                    key={tz}
                    style={styles.modalItem}
                    onPress={() => {
                      setTimezone(tz);
                      setTimezoneModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{tz}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setTimezoneModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },

  loadingText: { color: '#000', fontSize: 16 },

  title: {
    fontSize: 32,
    marginBottom: 30,
    fontWeight: 'bold',
    color: '#000',
  },

  label: {
    fontSize: 16,
    marginTop: 15,
    color: '#000',
  },

  value: {
    fontSize: 16,
    marginTop: 5,
    marginBottom: 10,
    color: '#000',
  },

  input: {
    borderWidth: 1,
    borderColor: '#00000033',
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
    fontSize: 16,
    backgroundColor: '#FFF',
  },

  inlineError: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'right',
    marginTop: 4,
    fontWeight: '500',
  },

  inlineSuccess: {
    color: '#4CD964',
    fontSize: 14,
    textAlign: 'right',
    marginTop: 4,
    fontWeight: '500',
  },

  saveButton: {
    backgroundColor: '#0E734A',
    padding: 14,
    borderRadius: 8,
    marginTop: 30,
    alignItems: 'center',
  },
  saveText: { color: 'white', fontWeight: '600', fontSize: 16 },

  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  logoutText: { color: 'white', fontWeight: '600', fontSize: 16 },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00000055',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    width: '90%',
    height: '70%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#000',
  },

  modalSearch: {
    borderWidth: 1,
    borderColor: '#00000033',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    color: '#000',
  },

  modalItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#00000011',
  },

  modalItemText: {
    fontSize: 16,
    color: '#000',
  },

  modalClose: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#0E734A',
    borderRadius: 8,
    alignItems: 'center',
  },

  modalCloseText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});