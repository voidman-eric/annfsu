import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import api from '../../utils/api';

interface Song {
  id: string;
  title_ne: string;
  category: string;
  duration: string;
}

export default function MusicScreen() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchSongs();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const fetchSongs = async () => {
    try {
      const response = await api.get('/api/songs');
      setSongs(response.data);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const playSong = async (songId: string) => {
    try {
      // Stop current song if playing
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      // Fetch audio data
      const response = await api.get(`/api/songs/${songId}/audio`);
      const { audio_data } = response.data;

      // Create sound from base64
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audio_data },
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlayingId(songId);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          setPlayingId(null);
        }
      });
    } catch (error) {
      console.error('Error playing song:', error);
      Alert.alert('त्रुटि', 'गीत बजाउन सकिएन');
    }
  };

  const pauseSong = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const resumeSong = async () => {
    if (sound) {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const stopSong = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setPlayingId(null);
      setIsPlaying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#DC143C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {songs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>कुनै गीत उपलब्ध छैन</Text>
          </View>
        ) : (
          songs.map((song) => (
            <View key={song.id} style={styles.songCard}>
              <View style={styles.songInfo}>
                <Text style={styles.songTitle}>{song.title_ne}</Text>
                <Text style={styles.songDuration}>{song.duration}</Text>
              </View>
              <View style={styles.controls}>
                {playingId === song.id ? (
                  isPlaying ? (
                    <TouchableOpacity style={styles.controlButton} onPress={pauseSong}>
                      <Ionicons name="pause" size={24} color="#DC143C" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.controlButton} onPress={resumeSong}>
                      <Ionicons name="play" size={24} color="#DC143C" />
                    </TouchableOpacity>
                  )
                ) : (
                  <TouchableOpacity style={styles.controlButton} onPress={() => playSong(song.id)}>
                    <Ionicons name="play" size={24} color="#DC143C" />
                  </TouchableOpacity>
                )}
                {playingId === song.id && (
                  <TouchableOpacity style={styles.controlButton} onPress={stopSong}>
                    <Ionicons name="stop" size={24} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {playingId && (
        <View style={styles.nowPlaying}>
          <View style={styles.nowPlayingContent}>
            <Ionicons name="musical-note" size={20} color="#fff" />
            <Text style={styles.nowPlayingText}>
              {isPlaying ? 'बजिरहेको' : 'रोकिएको'}: {songs.find((s) => s.id === playingId)?.title_ne}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  songCard: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  songDuration: {
    fontSize: 12,
    color: '#999',
  },
  controls: {
    flexDirection: 'row',
  },
  controlButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  nowPlaying: {
    backgroundColor: '#DC143C',
    padding: 16,
  },
  nowPlayingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowPlayingText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});
