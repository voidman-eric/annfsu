import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Dimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface MembershipCardProps {
  user: {
    full_name: string;
    address: string;
    institution: string;
    committee: string;
    position?: string;
    issue_date?: string;
    membership_id?: string;
    photo?: string;
    id: string;
  };
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const CARD_HEIGHT = CARD_WIDTH / 2.7; // Landscape ratio ~2.7:1

export default function MembershipCardView({ user }: MembershipCardProps) {
  const [showBack, setShowBack] = useState(false);
  const frontCardRef = useRef<any>(null);
  const backCardRef = useRef<any>(null);

  const downloadCard = async (side: 'front' | 'back') => {
    try {
      const cardRef = side === 'front' ? frontCardRef : backCardRef;
      if (!cardRef.current) {
        Alert.alert('त्रुटि', 'कार्ड लोड हुन सकेन');
        return;
      }

      const uri = await cardRef.current.capture();
      
      // Share the card
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `सदस्यता कार्ड (${side === 'front' ? 'अगाडि' : 'पछाडि'})`
        });
      } else {
        Alert.alert('सफल', 'कार्ड सेभ भयो!');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('त्रुटि', 'कार्ड डाउनलोड गर्न असफल');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        {!showBack ? (
          <ViewShot ref={frontCardRef} options={{ format: 'png', quality: 1.0 }}>
            <FrontCard user={user} />
          </ViewShot>
        ) : (
          <ViewShot ref={backCardRef} options={{ format: 'png', quality: 1.0 }}>
            <BackCard />
          </ViewShot>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowBack(!showBack)}
        >
          <Ionicons name="sync" size={20} color="#DC143C" />
          <Text style={styles.controlText}>
            {showBack ? 'अगाडि हेर्नुहोस्' : 'पछाडि हेर्नुहोस्'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => downloadCard(showBack ? 'back' : 'front')}
        >
          <Ionicons name="download" size={20} color="#DC143C" />
          <Text style={styles.controlText}>डाउनलोड गर्नुहोस्</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FrontCard({ user }: MembershipCardProps) {
  return (
    <View style={[styles.card, { height: CARD_HEIGHT }]}>
      {/* Red Top Border */}
      <View style={styles.topBorder} />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>ANNFSU</Text>
          </View>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitleNe}>अखिल नेपाल राष्ट्रिय</Text>
          <Text style={styles.headerTitleNe}>स्वतन्त्र विद्यार्थी युनियन</Text>
          <Text style={styles.headerTitleEn}>All Nepal National Free Students Union</Text>
          <View style={styles.headerSubInfo}>
            <Text style={styles.headerSubText}>केन्द्रीय समिति</Text>
            <Text style={styles.headerSubText}>स्थापना: २०२२</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Left Side - Member Info */}
        <View style={styles.leftSection}>
          <View style={styles.membershipTitle}>
            <Text style={styles.membershipTitleText}>सदस्यता-पत्र</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>सदस्यता नं :</Text>
            <Text style={styles.fieldValue}>{user.membership_id || 'N/A'}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>नाम :</Text>
            <Text style={styles.fieldValue}>{user.full_name}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>ठेगाना :</Text>
            <Text style={styles.fieldValue}>{user.address}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>शैक्षिक संस्था :</Text>
            <Text style={styles.fieldValue}>{user.institution}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>समिति :</Text>
            <Text style={styles.fieldValue}>{user.committee}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>पद :</Text>
            <Text style={styles.fieldValue}>{user.position || 'सदस्य'}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>जारी मिति :</Text>
            <Text style={styles.fieldValue}>
              {user.issue_date ? new Date(user.issue_date).toLocaleDateString('ne-NP') : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Right Side - Photo and QR */}
        <View style={styles.rightSection}>
          <View style={styles.photoContainer}>
            {user.photo ? (
              <Image source={{ uri: user.photo }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={40} color="#999" />
              </View>
            )}
          </View>

          <View style={styles.signatureArea}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>क. दिपक धामी</Text>
            <Text style={styles.signatureDesignation}>अध्यक्ष</Text>
          </View>

          <View style={styles.qrContainer}>
            <Text style={styles.scanMeText}>Scan Me!</Text>
            <QRCode
              value={JSON.stringify({
                id: user.id,
                membership_id: user.membership_id,
                name: user.full_name,
                committee: user.committee
              })}
              size={60}
            />
          </View>

          <View style={styles.whatsappContainer}>
            <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
            <Text style={styles.whatsappText}>WhatsApp No:</Text>
            <Text style={styles.whatsappNumber}>985-1003885</Text>
          </View>
        </View>
      </View>

      {/* Red Bottom Border */}
      <View style={styles.bottomBorder} />
    </View>
  );
}

function BackCard() {
  return (
    <View style={[styles.card, { height: CARD_HEIGHT }]}>
      {/* Red Top Border */}
      <View style={styles.topBorder} />

      <View style={styles.backContent}>
        {/* Left Section */}
        <View style={styles.backLeftSection}>
          <Text style={styles.backTitle}>
            शैक्षिक आन्दोलनको नेता, लोकतान्त्रिक गणतन्त्रको प्रहरी, राष्ट्रियताको क्षेत्रहरुमा र सा.सा. शिक्षण अस्पतालमा उपचारका लागि ४५ प्रतिशत सुविधाको सुनिश्चित गर्ने । शैक्षिक १ ऋणका सुविधा गर्ने ।
          </Text>

          <Text style={styles.backStatement}>
            अनेरास्विकोको आधिकारिक फेसबुक पेज अनेरास्विकोमा जोइनुहोस् ।
          </Text>

          <View style={styles.backFieldSection}>
            <Text style={styles.backFieldTitle}>सदस्यता प्रदान गर्ने :</Text>
            <View style={styles.backDottedLine} />

            <View style={styles.backFieldRow}>
              <Text style={styles.backFieldLabel}>समिति :</Text>
              <View style={styles.backSmallLine} />
            </View>

            <View style={styles.backFieldRow}>
              <Text style={styles.backFieldLabel}>हस्ताक्षर :</Text>
              <View style={styles.backSmallLine} />
            </View>
          </View>
        </View>

        {/* Right Section */}
        <View style={styles.backRightSection}>
          <Text style={styles.backFieldTitle}>सदस्यता प्रदान गर्ने :</Text>
          <View style={styles.backDottedLine} />

          <View style={styles.backFieldRow}>
            <Text style={styles.backFieldLabel}>समिति :</Text>
            <View style={styles.backSmallLine} />
          </View>

          <View style={styles.backFieldRow}>
            <Text style={styles.backFieldLabel}>पद :</Text>
            <View style={styles.backSmallLine} />
          </View>

          <View style={styles.backFieldRow}>
            <Text style={styles.backFieldLabel}>हस्ताक्षर :</Text>
            <View style={styles.backSmallLine} />
          </View>
        </View>
      </View>

      {/* Red Bottom Border */}
      <View style={styles.bottomBorder} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  cardContainer: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  topBorder: {
    height: 6,
    backgroundColor: '#DC143C',
  },
  bottomBorder: {
    height: 6,
    backgroundColor: '#DC143C',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F8F8',
  },
  headerLeft: {
    marginRight: 8,
  },
  logoContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#DC143C',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitleNe: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1565C0',
    lineHeight: 14,
  },
  headerTitleEn: {
    fontSize: 8,
    color: '#1565C0',
    marginTop: 2,
  },
  headerSubInfo: {
    flexDirection: 'row',
    marginTop: 4,
  },
  headerSubText: {
    fontSize: 7,
    color: '#666',
    marginRight: 12,
  },
  mainContent: {
    flexDirection: 'row',
    flex: 1,
    padding: 12,
  },
  leftSection: {
    flex: 1.3,
    paddingRight: 8,
  },
  membershipTitle: {
    backgroundColor: '#DC143C',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  membershipTitleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 8,
    color: '#1565C0',
    width: 80,
  },
  fieldValue: {
    fontSize: 8,
    color: '#333',
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderStyle: 'dotted',
    paddingBottom: 2,
  },
  rightSection: {
    flex: 1,
    alignItems: 'center',
  },
  photoContainer: {
    width: 80,
    height: 90,
    borderWidth: 2,
    borderColor: '#1565C0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureArea: {
    alignItems: 'center',
    marginBottom: 8,
  },
  signatureLine: {
    width: 60,
    height: 1,
    backgroundColor: '#333',
    marginBottom: 2,
  },
  signatureLabel: {
    fontSize: 7,
    color: '#333',
  },
  signatureDesignation: {
    fontSize: 6,
    color: '#666',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#1565C0',
    padding: 6,
    borderRadius: 4,
  },
  scanMeText: {
    fontSize: 8,
    color: '#1565C0',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  whatsappContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  whatsappText: {
    fontSize: 6,
    color: '#333',
    marginLeft: 3,
  },
  whatsappNumber: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#25D366',
    marginLeft: 2,
  },
  // Back Card Styles
  backContent: {
    flexDirection: 'row',
    flex: 1,
    padding: 12,
  },
  backLeftSection: {
    flex: 1,
    paddingRight: 12,
  },
  backRightSection: {
    flex: 1,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
  },
  backTitle: {
    fontSize: 8,
    color: '#1565C0',
    lineHeight: 12,
    marginBottom: 12,
    fontWeight: '600',
  },
  backStatement: {
    fontSize: 7,
    color: '#333',
    marginBottom: 16,
    lineHeight: 10,
  },
  backFieldSection: {
    marginTop: 8,
  },
  backFieldTitle: {
    fontSize: 8,
    color: '#1565C0',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  backDottedLine: {
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    borderStyle: 'dotted',
    marginBottom: 8,
  },
  backFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backFieldLabel: {
    fontSize: 7,
    color: '#333',
    width: 50,
  },
  backSmallLine: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    borderStyle: 'dotted',
  },
  // Controls
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DC143C',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  controlText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#DC143C',
    fontWeight: '600',
  },
});
