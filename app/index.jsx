import { useEffect, useState } from "react";
import { FlatList, Image, ScrollView, Text, TouchableOpacity, View, TextInput, Alert, Linking } from "react-native";
import { collection, doc, getDocs, serverTimestamp, setDoc, updateDoc, getDoc } from "firebase/firestore"
import db from '@/firebase'
import Loader from "./components/Loader";

// Define an enum or constants for better readability
const Section = {
  VENDORS: 'vendors',
  CUSTOMERS: 'customers',
  RECHARGE: 'recharge',
  CATEGORY: 'category',
  REGISTER: 'register',
  NONE: null,
};

const ADMIN_PASSWORD = "Ravi@1234";

// Enhanced Web Fingerprinting
class EnhancedDeviceFingerprinter {
  constructor() {
    this.components = new Map();
  }

  // Collect various browser fingerprints
  async collectFingerprintComponents() {
    try {
      // 1. User Agent and Platform
      this.components.set('userAgent', navigator.userAgent || '');
      this.components.set('platform', navigator.platform || '');
      this.components.set('vendor', navigator.vendor || '');

      // 2. Language and Timezone
      this.components.set('language', navigator.language || '');
      this.components.set('languages', navigator.languages ? navigator.languages.join(',') : '');
      this.components.set('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);

      // 3. Screen Properties
      this.components.set('screenResolution', `${screen.width}x${screen.height}`);
      this.components.set('colorDepth', screen.colorDepth.toString());
      this.components.set('pixelDepth', screen.pixelDepth.toString());

      // 4. Hardware Concurrency
      this.components.set('hardwareConcurrency', navigator.hardwareConcurrency?.toString() || 'unknown');

      // 5. Canvas Fingerprinting (more stable)
      const canvasFingerprint = await this.getCanvasFingerprint();
      this.components.set('canvas', canvasFingerprint);

      // 6. WebGL Fingerprinting
      const webglFingerprint = await this.getWebGLFingerprint();
      this.components.set('webgl', webglFingerprint);

      // 7. Fonts Detection
      const fonts = await this.detectFonts();
      this.components.set('fonts', fonts);

      // 8. Audio Context Fingerprinting
      const audioFingerprint = await this.getAudioFingerprint();
      this.components.set('audio', audioFingerprint);

      // 9. Timezone Offset
      this.components.set('timezoneOffset', new Date().getTimezoneOffset().toString());

      // 10. Session Storage Support
      this.components.set('sessionStorage', (typeof sessionStorage !== 'undefined').toString());

      // 11. Local Storage Support
      this.components.set('localStorage', (typeof localStorage !== 'undefined').toString());

      // 12. IndexedDB Support
      this.components.set('indexedDB', (typeof indexedDB !== 'undefined').toString());

      // 13. Touch Support
      this.components.set('touchSupport', ('ontouchstart' in window).toString());

      // 14. Do Not Track
      this.components.set('doNotTrack', navigator.doNotTrack || 'unknown');

    } catch (error) {
      console.warn('Error collecting some fingerprint components:', error);
    }
  }

  // Canvas Fingerprinting
  async getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = 200;
      canvas.height = 50;

      // Draw text with various properties
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Enhanced Fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Enhanced Fingerprint', 4, 17);

      return await this.canvasToHash(canvas);
    } catch (error) {
      return 'canvas_error';
    }
  }

  // WebGL Fingerprinting
  async getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (!gl) return 'webgl_unsupported';

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = gl.getParameter(debugInfo ? debugInfo.UNMASKED_VENDOR_WEBGL : gl.VENDOR);
      const renderer = gl.getParameter(debugInfo ? debugInfo.UNMASKED_RENDERER_WEBGL : gl.RENDERER);

      return `${vendor}|${renderer}`;
    } catch (error) {
      return 'webgl_error';
    }
  }

  // Font Detection
  async detectFonts() {
    const baseFonts = [
      'Arial', 'Arial Black', 'Arial Narrow', 'Calibri',
      'Cambria', 'Cambria Math', 'Comic Sans MS', 'Courier New',
      'Georgia', 'Impact', 'Lucida Console', 'Lucida Sans Unicode',
      'Microsoft Sans Serif', 'Palatino Linotype', 'Segoe UI',
      'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana'
    ];

    const testString = "mmmmmmmmmmlli";
    const testSize = '72px';
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    context.textBaseline = 'top';
    context.font = testSize + " monospace";

    const referenceWidth = context.measureText(testString).width;
    const detectedFonts = [];

    for (const font of baseFonts) {
      context.font = testSize + " '" + font + "', monospace";
      const width = context.measureText(testString).width;
      if (width !== referenceWidth) {
        detectedFonts.push(font);
      }
    }

    return detectedFonts.join(',');
  }

  // Audio Context Fingerprinting
  async getAudioFingerprint() {
    try {
      const audioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!audioContext) return 'audio_unsupported';

      const context = new audioContext(1, 44100, 44100);
      const oscillator = context.createOscillator();
      const compressor = context.createDynamicsCompressor();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, context.currentTime);

      oscillator.connect(compressor);
      compressor.connect(context.destination);
      oscillator.start(0);

      const audioBuffer = await new Promise((resolve, reject) => {
        context.oncomplete = (event) => resolve(event.renderedBuffer);
        context.startRendering();
        setTimeout(() => reject(new Error('Audio timeout')), 1000);
      });

      const data = audioBuffer.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += Math.abs(data[i]);
      }

      return sum.toString();
    } catch (error) {
      return 'audio_error';
    }
  }

  // Convert canvas to hash
  async canvasToHash(canvas) {
    try {
      const imageData = canvas.toDataURL();
      const encoder = new TextEncoder();
      const data = encoder.encode(imageData);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    } catch (error) {
      // Fallback to simple hash
      return this.simpleHash(canvas.toDataURL());
    }
  }

  // Simple hash fallback
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // Generate final device ID
  async generateDeviceId() {
    await this.collectFingerprintComponents();

    // Create a fingerprint string from all components
    const fingerprintString = Array.from(this.components.entries())
      .map(([key, value]) => `${key}:${value}`)
      .sort()
      .join('|');

    // Generate hash
    let finalHash;
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(fingerprintString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      finalHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      finalHash = this.simpleHash(fingerprintString);
    }

    return 'web_' + finalHash.substring(0, 24);
  }
}

// Main device ID generator with caching
const generateEnhancedDeviceId = async () => {
  if (typeof window === 'undefined') {
    return 'server_side_' + Date.now();
  }

  // Check for existing ID in localStorage
  const storedId = localStorage.getItem('enhanced_device_id');
  if (storedId) {
    return storedId;
  }

  try {
    const fingerprinter = new EnhancedDeviceFingerprinter();
    const deviceId = await fingerprinter.generateDeviceId();

    // Store in localStorage for persistence
    localStorage.setItem('enhanced_device_id', deviceId);

    // Also store the fingerprint components for debugging
    localStorage.setItem('fingerprint_components', JSON.stringify(
      Array.from(fingerprinter.components.entries())
    ));

    return deviceId;
  } catch (error) {
    console.error('Enhanced fingerprinting failed:', error);

    // Fallback to simple fingerprint
    return generateFallbackDeviceId();
  }
};

// Fallback device ID generator
const generateFallbackDeviceId = () => {
  const components = [
    navigator.userAgent,
    navigator.platform,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset()
  ].join('|');

  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const deviceId = 'fallback_' + Math.abs(hash).toString(36);
  localStorage.setItem('enhanced_device_id', deviceId);
  return deviceId;
};

export default function Index() {
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [fingerprintDetails, setFingerprintDetails] = useState(null);
  const [activeSection, setActiveSection] = useState(Section.NONE);
  const [isCommonLoaderVisible, setIsCommonLoaderVisible] = useState(false);
  const [allVendorsList, setAllVendorsList] = useState(null);
  const [allCustomersList, setAllCustomersList] = useState(null)
  const [registerVendorForm, setRegisterVendorForm] = useState({
    vendorName: '',
    vendorMobileNumber: '',
    vendorPassword: '',
    category: '',
    balance: 0,
    businessName: '',
    businessImageURL: '',
    deliveryModes: { takeaway: true },
    vendorEmailAddress: '',
    vendorAddress: {
      vendorBusinessPlotNumberOrShopNumber: '',
      vendorBusinessComplexNameOrBuildingName: '',
      vendorBusinessRoadNameOrStreetName: '',
      vendorBusinessVillageNameOrTownName: '',
      vendorBusinessLandmark: '',
      vendorBusinessCity: '',
      vendorBusinessState: '',
      vendorBusinessPincode: '',
      vendorLocation: {
        latitude: '',
        longitude: '',
        fullAddress: '',
      },
    }
  })

  useEffect(() => {
    initializeDeviceAuth();
  }, []);

  const initializeDeviceAuth = async () => {
    try {
      const uniqueDeviceId = await generateEnhancedDeviceId();
      setDeviceId(uniqueDeviceId);

      // Load fingerprint details for debugging
      const storedComponents = localStorage.getItem('fingerprint_components');
      if (storedComponents) {
        setFingerprintDetails(JSON.parse(storedComponents));
      }

      console.log('Enhanced Device ID:', uniqueDeviceId);

      // Check if this device is already authenticated
      const authDocRef = doc(db, 'adminAuth', 'trustedDevices');
      const authDoc = await getDoc(authDocRef);

      if (authDoc.exists()) {
        const trustedDevices = authDoc.data().devices || [];
        if (trustedDevices.includes(uniqueDeviceId)) {
          setIsAuthenticated(true);
          return;
        }
      }

      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error initializing enhanced device auth:', error);
      setIsAuthenticated(false);
    }
  };

  const handleAdminLogin = async () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);

      // Store this device as trusted
      if (deviceId && !deviceId.startsWith('unknown')) {
        try {
          const authDocRef = doc(db, 'adminAuth', 'trustedDevices');
          const authDoc = await getDoc(authDocRef);

          if (authDoc.exists()) {
            const trustedDevices = authDoc.data().devices || [];
            if (!trustedDevices.includes(deviceId)) {
              await updateDoc(authDocRef, {
                devices: [...trustedDevices, deviceId],
                lastAuthenticated: serverTimestamp()
              });
            }
          } else {
            await setDoc(authDocRef, {
              devices: [deviceId],
              createdAt: serverTimestamp(),
              lastAuthenticated: serverTimestamp()
            });
          }
        } catch (error) {
          console.error('Error saving trusted device:', error);
        }
      }
    } else {
      Alert.alert('Error', 'Invalid admin password');
    }
  };

  const handleLogout = async () => {
    if (deviceId) {
      try {
        const authDocRef = doc(db, 'adminAuth', 'trustedDevices');
        const authDoc = await getDoc(authDocRef);

        if (authDoc.exists()) {
          const trustedDevices = authDoc.data().devices || [];
          const updatedDevices = trustedDevices.filter(id => id !== deviceId);

          await updateDoc(authDocRef, {
            devices: updatedDevices
          });
        }
      } catch (error) {
        console.error('Error removing trusted device:', error);
      }
    }

    setIsAuthenticated(false);
    setAdminPassword('');
  };

  // Debug function to show fingerprint details
  const showFingerprintDetails = () => {
    if (fingerprintDetails) {
      Alert.alert(
        'Fingerprint Details',
        fingerprintDetails.map(([key, value]) => `${key}: ${value}`).join('\n'),
        [{ text: 'OK' }]
      );
    }
  };

  const fetchAllVendors = async () => {
    try {
      const allVendorsRef = collection(db, 'users');
      const allVendorsSnap = await getDocs(allVendorsRef);

      // Create an array of promises for concurrent fetching
      const vendorPromises = allVendorsSnap.docs.map(async (doc) => { // ⬅️ Must be 'async'
        const vendorData = doc.data();
        const vendorMobileNumber = vendorData.vendorMobileNumber;

        // --- Fetch Vendor Items (Subcollection) ---
        const vendorItemsListRef = collection(db, 'users', vendorMobileNumber, 'list');
        const vendorItemsSnap = await getDocs(vendorItemsListRef); // ⬅️ AWAIT
        const isVendorItemsListEmpty = vendorItemsSnap.empty;

        // --- Fetch Vendor Addresses (Subcollection) ---
        const vendorAddressRef = collection(db, 'users', vendorMobileNumber, 'savedAddresses');
        const vendorAddressSnap = await getDocs(vendorAddressRef); // ⬅️ AWAIT

        // Use .map() to process the address documents
        const vendorAddressList = vendorAddressSnap.docs.map((addressDoc) => ({
          ...addressDoc.data(),
          id: addressDoc.id,
        }));

        const isVendorBalanceLow = vendorData?.balance <= 12;

        // Final Status Logic: If empty OR low, then 'Inactive'. Otherwise, 'Active'.
        const isVendorActive = (isVendorItemsListEmpty || isVendorBalanceLow) ? 'Inactive' : 'Active';

        return {
          ...vendorData,
          id: doc.id,
          isVendorActive,
          savedAddresses: vendorAddressList[0] || null,
        };
      });

      // Await all promises to resolve to get the final list
      const vendorsList = await Promise.all(vendorPromises);
      setAllVendorsList(vendorsList);

    } catch (error) {
      // The original error reporting is good, but add more detail if possible
      console.error("Error fetching vendors (subcollections failed):", error);
    }
  };

  const fetchAllCustomers = async () => {
    try {
      const allCustomersRef = collection(db, 'customers');
      const allCustomersSnap = await getDocs(allCustomersRef);

      // Create an array of promises for concurrent fetching
      const customerPromises = allCustomersSnap.docs.map(async (doc) => { // ⬅️ Must be 'async'
        const customerData = doc.data();
        const customerMobileNumber = customerData.customerMobileNumber;

        // --- Fetch Customer Addresses (Subcollection) ---
        const customerAddressRef = collection(db, 'customers', customerMobileNumber, 'savedAddresses');
        const customerAddressSnap = await getDocs(customerAddressRef); // ⬅️ AWAIT

        // Use .map() to process the address documents
        const customerAddressList = customerAddressSnap.docs.map((addressDoc) => ({
          ...addressDoc.data(),
          id: addressDoc.id,
        }));

        return {
          ...customerData,
          id: doc.id,
          savedAddresses: customerAddressList || null,
        };
      });

      // Await all promises to resolve to get the final list
      const customersList = await Promise.all(customerPromises);
      setAllCustomersList(customersList);

    } catch (error) {
      // The original error reporting is good, but add more detail if possible
      console.error("Error fetching vendors (subcollections failed):", error);
    }
  };

  const registerVendor = async () => {
    try {
      setIsCommonLoaderVisible(true)
      const savedAddressesDocRef = collection(db, 'users', registerVendorForm.vendorMobileNumber, 'savedAddresses');
      const savedAddressesDocConvertedRef = doc(savedAddressesDocRef);

      await setDoc(savedAddressesDocConvertedRef, {
        vendorBusinessPlotNumberOrShopNumber: registerVendorForm.vendorAddress.vendorBusinessPlotNumberOrShopNumber,
        vendorBusinessComplexNameOrBuildingName: registerVendorForm.vendorAddress.vendorBusinessComplexNameOrBuildingName,
        vendorBusinessRoadNameOrStreetName: registerVendorForm.vendorAddress.vendorBusinessRoadNameOrStreetName,
        vendorBusinessVillageNameOrTownName: registerVendorForm.vendorAddress.vendorBusinessVillageNameOrTownName,
        vendorBusinessLandmark: registerVendorForm.vendorAddress.vendorBusinessLandmark,
        vendorBusinessCity: registerVendorForm.vendorAddress.vendorBusinessCity,
        vendorBusinessState: registerVendorForm.vendorAddress.vendorBusinessState,
        vendorBusinessPincode: registerVendorForm.vendorAddress.vendorBusinessPincode,
        createdAt: serverTimestamp(),
        vendorLocation: {
          latitude: registerVendorForm.vendorAddress.vendorLocation.latitude,
          longitude: registerVendorForm.vendorAddress.vendorLocation.longitude,
          fullAddress: registerVendorForm.vendorAddress.vendorLocation.fullAddress
        },
      });

      const allVendorData = {
        vendorMobileNumber: registerVendorForm.vendorMobileNumber,
        vendorPassword: registerVendorForm.vendorPassword,
        vendorName: registerVendorForm.vendorName,
        businessName: registerVendorForm.businessName,
        category: registerVendorForm.category,
        disabled: false,
        balance: Number(registerVendorForm.balance),
        businessImageURL: registerVendorForm.businessImageURL === '' || registerVendorForm.businessImageURL === null ? null : registerVendorForm.businessImageURL,
        deliveryModes: registerVendorForm.deliveryModes,
        vendorEmailAddress: registerVendorForm.vendorEmailAddress,
        timestamp: serverTimestamp()
      };

      const vendorRef = doc(db, 'users', registerVendorForm.vendorMobileNumber)
      await updateDoc(vendorRef, {
        ...allVendorData
      })

      setRegisterVendorForm({
        vendorName: '',
        vendorMobileNumber: '',
        vendorPassword: '',
        category: '',
        balance: 0,
        businessName: '',
        businessImageURL: '',
        deliveryModes: { takeaway: true },
        vendorEmailAddress: '',
        vendorAddress: {
          vendorBusinessPlotNumberOrShopNumber: '',
          vendorBusinessComplexNameOrBuildingName: '',
          vendorBusinessRoadNameOrStreetName: '',
          vendorBusinessVillageNameOrTownName: '',
          vendorBusinessLandmark: '',
          vendorBusinessCity: '',
          vendorBusinessState: '',
          vendorBusinessPincode: '',
          vendorLocation: {
            latitude: '',
            longitude: '',
            fullAddress: '',
          },
        }
      })

      alert('Registeration Successfull!')
    } catch (error) {
      console.log('Error registering vendor: ', error)
      alert('Error registering vendor: ' + error)
    } finally {
      setIsCommonLoaderVisible(false)
    }
  }

  useEffect(() => {
    fetchAllVendors();
    fetchAllCustomers()
  }, []);

  const toggleSection = (sectionName) => {
    setActiveSection(activeSection === sectionName ? Section.NONE : sectionName);
  };

  const isSectionActive = (sectionName) => activeSection === sectionName;

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-white justify-center items-center p-5">
        <View className="w-full max-w-md bg-gray-50 p-6 rounded-lg border border-gray-200">
          <Text className="text-2xl font-bold text-primary text-center mb-2">
            Admin Login
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Enter admin password to continue
          </Text>

          <TextInput
            className="w-full border border-gray-300 rounded-lg p-3 mb-4 bg-white"
            placeholder="Enter admin password"
            secureTextEntry
            value={adminPassword}
            onChangeText={setAdminPassword}
            onSubmitEditing={handleAdminLogin}
          />

          <TouchableOpacity
            className="bg-primary py-3 rounded-lg mb-3"
            onPress={handleAdminLogin}
          >
            <Text className="text-white text-center font-bold text-lg">
              Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-200 py-2 rounded-lg"
            onPress={showFingerprintDetails}
          >
            <Text className="text-gray-700 text-center text-sm">
              Show Fingerprint Details
            </Text>
          </TouchableOpacity>

          <Text className="text-xs text-gray-500 text-center mt-4">
            Enhanced Device ID: {deviceId ? `${deviceId.substring(0, 16)}...` : 'Generating...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">

      {isCommonLoaderVisible && <Loader />}

      <ScrollView showsHorizontalScrollIndicator={false} contentContainerClassName="gap-[2px]" className="w-full max-h-[100px]" horizontal>

        {/* All Vendors */}
        <TouchableOpacity
          onPress={() => toggleSection(Section.VENDORS)}
          className={`h-full w-[120px] border-[5px] rounded-[5px] ${isSectionActive(Section.VENDORS) ? 'bg-wheat' : 'bg-white'} border-primary p-[10px] items-center justify-center`} >
          <Text className="font-bold text-primary text-[16px] text-center" >All Vendors</Text>
          <Text className="font-bold text-primary text-[16px] text-center" >({allVendorsList?.length || 0})</Text>
        </TouchableOpacity>

        {/* All Customers */}
        <TouchableOpacity
          onPress={() => toggleSection(Section.CUSTOMERS)}
          className={`h-full w-[120px] border-[5px] rounded-[5px] ${isSectionActive(Section.CUSTOMERS) ? 'bg-wheat' : 'bg-white'} border-primary p-[10px] items-center justify-center`} >
          <Text className="font-bold text-primary text-[16px] text-center" >All Customers</Text>
          <Text className="font-bold text-primary text-[16px] text-center" >({allCustomersList?.length || 0})</Text>
        </TouchableOpacity>

        {/* Add Recharge */}
        <TouchableOpacity
          onPress={() => toggleSection(Section.RECHARGE)}
          className={`h-full w-[120px] border-[5px] rounded-[5px] ${isSectionActive(Section.RECHARGE) ? 'bg-wheat' : 'bg-white'} border-primary p-[10px] items-center justify-center`} >
          <Text className="font-bold text-primary text-[16px] text-center" >Add Recharge</Text>
        </TouchableOpacity>

        {/* Add Category */}
        <TouchableOpacity
          onPress={() => toggleSection(Section.CATEGORY)}
          className={`h-full w-[120px] border-[5px] rounded-[5px] ${isSectionActive(Section.CATEGORY) ? 'bg-wheat' : 'bg-white'} border-primary p-[10px] items-center justify-center`} >
          <Text className="font-bold text-primary text-[16px] text-center" >Add Category</Text>
        </TouchableOpacity>

        {/* Register Vendor */}
        <TouchableOpacity
          onPress={() => toggleSection(Section.REGISTER)}
          className={`h-full w-[120px] border-[5px] rounded-[5px] ${isSectionActive(Section.REGISTER) ? 'bg-wheat' : 'bg-white'} border-primary p-[10px] items-center justify-center`} >
          <Text className="font-bold text-primary text-[16px] text-center" >Register Vendor</Text>
        </TouchableOpacity>

      </ScrollView>

      <View className="flex-1 p-[5px]">
        {activeSection === Section.VENDORS && (
          <FlatList
            data={allVendorsList.sort((a, b) => { const dateA = a.timestamp?.toDate?.(); const dateB = b.timestamp?.toDate?.(); const timeA = dateA ? dateA.getTime() : 0; const timeB = dateB ? dateB.getTime() : 0; return timeB - timeA; })}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <View className="p-[5px] border border-[#ccc] rounded-[10px] mb-[5px] gap-[5px]" >
                <Text className="text-[10px] h-[20px] w-[20px] rounded-tl-[5px] rounded-br-[5px] bg-primary text-white text-center leading-none absolute top-[0px] left-[0px] z-50 flex items-center justify-center" >{allVendorsList.length - index}</Text>
                <View className="flex-row gap-[5px]" >
                  <Image style={{ height: 150, width: 150 }} className="h-[150px] w-[150px] rounded-[5px]" source={item?.businessImageURL ? { uri: item?.businessImageURL } : require('../assets/images/placeholderImage.png')} />
                  <View className="flex-1 gap-[5px]" >
                    <View className="flex-row w-full justify-between items-center gap-[5px]" >
                      <Text className={`${item?.isVendorActive === 'Active' ? 'text-primaryGreen' : 'text-primaryRed'}`} >{item?.isVendorActive}</Text>
                      <Text className="text-primaryGreen border rounded px-[3px]" >₹{item?.balance || '0'}</Text>
                      <Text>{item?.timestamp?.toDate?.()?.toLocaleString() || 'No date...'}</Text>
                    </View>
                    <Text><Text className="font-bold" >Owner: </Text>{item?.vendorName || 'No name...'}</Text>
                    <Text className="text-primary font-bold" >{item?.vendorMobileNumber || 'No number...'}</Text>
                    <Text className="text-primary font-bold" >{item?.businessName || 'No business name...'}</Text>
                    <Text><Text className="font-bold" >Cateogry: </Text>{item?.category || 'No category...'}</Text>
                    <Text><Text className="font-bold" >Password: </Text>{item?.vendorPassword || 'No password...'}</Text>
                    <View className="flex-row justify-between gap-[5px]" >
                      <Text><Text className="text-primary font-bold" >{item?.vendorReferralCode || 'NA'}</Text> [ {item?.referralCode || 'NA'} ]</Text>
                      <Text><Text className="font-bold" >Comm.: </Text>₹{item?.vendorCommission || '0'}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity onPress={() => { if (!item?.savedAddresses?.vendorLocation?.latitude || !item?.savedAddresses?.vendorLocation?.longitude) { return } Linking.openURL(`https://www.google.com/maps/place/${item?.savedAddresses?.vendorLocation?.latitude}+${item?.savedAddresses?.vendorLocation?.longitude}/`) }} className="p-[10px] border-y-[5px] border-primary rounded-[10px] gap-[2px]" >
                  <Text>📍{item?.savedAddresses?.vendorBusinessPlotNumberOrShopNumber}, {item?.savedAddresses?.vendorBusinessComplexNameOrBuildingName}, {item?.savedAddresses?.vendorBusinessLandmark}, {item?.savedAddresses?.vendorBusinessRoadNameOrStreetName}, {item?.savedAddresses?.vendorBusinessVillageNameOrTownName}, {item?.savedAddresses?.vendorBusinessCity}, {item?.savedAddresses?.vendorBusinessState} - {item?.savedAddresses?.vendorBusinessPincode}</Text>
                  <Text><Text className="font-bold" >Long:</Text> {item?.savedAddresses?.vendorLocation?.longitude}, <Text className="font-bold" >Lati:</Text> {item?.savedAddresses?.vendorLocation?.latitude}</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text>Loading vendors...</Text>}
          />
        )}
        {activeSection === Section.CUSTOMERS && (
          <FlatList
            data={allCustomersList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))}
            renderItem={({ item, index }) => {
              return (
                <TouchableOpacity onPress={() => Linking.openURL(`https://customers.unoshops.com/Login?customerMobileNumberFromAdmin=${item?.customerMobileNumber}&customerPasswordFromAdmin=${item?.customerPassword}`)} className='border border-y-[3px] border-x border-primary rounded-[5px] p-[5px] mb-[5px] gap-[5px] bg-blue-100' >
                  <Text className="text-[10px] h-[20px] w-[20px] rounded-tl-[3px] rounded-br-[5px] bg-primary text-white text-center leading-none absolute top-[0px] left-[0px] z-50 flex items-center justify-center" >{allCustomersList.length - index}</Text>
                  <Text className='absolute top-[5px] right-[5px]' >{item?.timestamp?.toDate().toLocaleString() || 'No time...'}</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${item?.customerMobileNumber}`)} ><Text className='ml-[40px] text-primary' >{item?.customerMobileNumber || 'No number...'}</Text></TouchableOpacity>
                  <Text className='ml-[40px]' ><Text className='font-bold' >Password: </Text>{item?.customerPassword || 'No Password...'}</Text>
                  <Text className='ml-[40px]' >{item?.customerName || 'No name...'}</Text>
                  <FlatList
                    data={item?.savedAddresses || []}
                    horizontal
                    renderItem={({ item }) => {
                      return (
                        <TouchableOpacity onPress={() => { if (!item?.customerLocation?.latitude || !item?.customerLocation?.longitude) { return } Linking.openURL(`https://www.google.com/maps/place/${item?.customerLocation?.latitude}+${item?.customerLocation?.longitude}/`) }} className="p-[10px] border border-[#ccc] rounded-[10px] gap-[2px] mr-[5px] w-[300px]" >
                          <Text>📍{item?.customerPlotNumber}, {item?.customerComplexNameOrBuildingName}, {item?.customerLandmark}, {item?.customerRoadNameOrStreetName}, {item?.customerVillageNameOrTownName}, {item?.customerCity}, {item?.customerState} - {item?.customerPincode}</Text>
                          <Text><Text className="font-bold" >Long:</Text> {item?.customerLocation?.longitude}, <Text className="font-bold" >Lati:</Text> {item?.customerLocation?.latitude}</Text>
                        </TouchableOpacity>
                      )
                    }}
                  />
                </TouchableOpacity>
              )
            }}
          />
        )}
        {activeSection === Section.RECHARGE && <Text>Add Recharge Section</Text>}
        {activeSection === Section.CATEGORY && <Text>Add Category Section</Text>}
        {activeSection === Section.REGISTER && <Text>Register Vendor Section</Text>}
      </View>

    </View>
  );
}