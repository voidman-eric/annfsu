import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (base64: string, mimeType: string) => Promise<void>;
  onRemovePhoto?: () => Promise<void>;
  hasExistingPhoto?: boolean;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export default function ImagePickerModal({
  visible,
  onClose,
  onImageSelected,
  onRemovePhoto,
  hasExistingPhoto = false,
}: ImagePickerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const requestPermission = async (type: 'camera' | 'gallery'): Promise<boolean> => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'अनुमति आवश्यक',
          'क्यामेरा प्रयोग गर्न अनुमति दिनुहोस्',
          [{ text: 'ठीक छ' }]
        );
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'अनुमति आवश्यक',
          'फोटो लाइब्रेरी प्रयोग गर्न अनुमति दिनुहोस्',
          [{ text: 'ठीक छ' }]
        );
        return false;
      }
    }
    return true;
  };

  const validateImage = (result: ImagePicker.ImagePickerResult): boolean => {
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return false;
    }

    const asset = result.assets[0];
    const mimeType = asset.mimeType || 'image/jpeg';

    // Check file type
    if (!ALLOWED_TYPES.includes(mimeType.toLowerCase())) {
      Alert.alert(
        'अमान्य फाइल प्रकार',
        'कृपया JPG, JPEG, वा PNG फाइल मात्र छान्नुहोस्',
        [{ text: 'ठीक छ' }]
      );
      return false;
    }

    // Check file size (if available)
    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
      Alert.alert(
        'फाइल धेरै ठूलो छ',
        'कृपया 2 MB भन्दा सानो फाइल छान्नुहोस्',
        [{ text: 'ठीक छ' }]
      );
      return false;
    }

    return true;
  };

  const processImage = async (uri: string, mimeType: string): Promise<{ base64: string; mimeType: string }> => {
    setLoadingText('फोटो प्रशोधन गर्दै...');

    // Resize and compress the image
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [
        { resize: { width: 500, height: 500 } }, // Resize to max 500x500
      ],
      {
        compress: 0.7, // 70% quality
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    if (!manipulatedImage.base64) {
      throw new Error('Failed to process image');
    }

    return {
      base64: `data:image/jpeg;base64,${manipulatedImage.base64}`,
      mimeType: 'image/jpeg',
    };
  };

  const pickFromCamera = async () => {
    try {
      const hasPermission = await requestPermission('camera');
      if (!hasPermission) return;

      setIsLoading(true);
      setLoadingText('क्यामेरा खोल्दै...');

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!validateImage(result)) {
        setIsLoading(false);
        return;
      }

      const asset = result.assets![0];
      const { base64, mimeType } = await processImage(
        asset.uri,
        asset.mimeType || 'image/jpeg'
      );

      setLoadingText('अपलोड गर्दै...');
      await onImageSelected(base64, mimeType);
      onClose();
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('त्रुटि', 'फोटो खिच्न सकिएन', [{ text: 'ठीक छ' }]);
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  const pickFromGallery = async () => {
    try {
      const hasPermission = await requestPermission('gallery');
      if (!hasPermission) return;

      setIsLoading(true);
      setLoadingText('ग्यालेरी खोल्दै...');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!validateImage(result)) {
        setIsLoading(false);
        return;
      }

      const asset = result.assets![0];
      const { base64, mimeType } = await processImage(
        asset.uri,
        asset.mimeType || 'image/jpeg'
      );

      setLoadingText('अपलोड गर्दै...');
      await onImageSelected(base64, mimeType);
      onClose();
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('त्रुटि', 'फोटो छान्न सकिएन', [{ text: 'ठीक छ' }]);
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  const handleRemovePhoto = async () => {
    if (!onRemovePhoto) return;

    Alert.alert(
      'फोटो हटाउनुहोस्',
      'के तपाईं प्रोफाइल फोटो हटाउन चाहनुहुन्छ?',
      [
        { text: 'रद्द गर्नुहोस्', style: 'cancel' },
        {
          text: 'हटाउनुहोस्',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              setLoadingText('हटाउँदै...');
              await onRemovePhoto();
              onClose();
            } catch (error) {
              Alert.alert('त्रुटि', 'फोटो हटाउन सकिएन', [{ text: 'ठीक छ' }]);
            } finally {
              setIsLoading(false);
              setLoadingText('');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.content}>
              <View style={styles.handle} />
              <Text style={styles.title}>प्रोफाइल फोटो</Text>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#DC143C" />
                  <Text style={styles.loadingText}>{loadingText}</Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.option}
                    onPress={pickFromCamera}
                  >
                    <View style={styles.iconContainer}>
                      <Ionicons name="camera" size={24} color="#DC143C" />
                    </View>
                    <Text style={styles.optionText}>क्यामेराबाट खिच्नुहोस्</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.option}
                    onPress={pickFromGallery}
                  >
                    <View style={styles.iconContainer}>
                      <Ionicons name="images" size={24} color="#DC143C" />
                    </View>
                    <Text style={styles.optionText}>ग्यालेरीबाट छान्नुहोस्</Text>
                  </TouchableOpacity>

                  {hasExistingPhoto && onRemovePhoto && (
                    <TouchableOpacity
                      style={[styles.option, styles.removeOption]}
                      onPress={handleRemovePhoto}
                    >
                      <View style={[styles.iconContainer, styles.removeIconContainer]}>
                        <Ionicons name="trash" size={24} color="#F44336" />
                      </View>
                      <Text style={[styles.optionText, styles.removeText]}>
                        फोटो हटाउनुहोस्
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onClose}
                  >
                    <Text style={styles.cancelText}>रद्द गर्नुहोस्</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  content: {
    padding: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  removeOption: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  removeIconContainer: {
    backgroundColor: '#FFEBEE',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  removeText: {
    color: '#F44336',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
});
