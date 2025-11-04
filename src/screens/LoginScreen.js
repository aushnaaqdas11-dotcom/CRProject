import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  Animated,
  Image,
  ActivityIndicator,
  ImageBackground
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '../styles/theme';
import { useAuth } from '../context/AuthContext';

// WigglyChar component
const WigglyChar = ({ char }) => {
  const rotation = useRef(new Animated.Value(Math.random() * 20 - 10)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(rotation, { toValue: Math.random() * 40 - 20, duration: 2000, useNativeDriver: true }),
        Animated.timing(rotation, { toValue: Math.random() * 40 - 20, duration: 2000, useNativeDriver: true }),
      ]).start(() => animate());
    };
    animate();
  }, [rotation]);

  return (
    <Animated.Text
      style={{
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4ECDC4',
        marginHorizontal: 2,
        fontFamily: 'monospace',
        transform: [{ rotate: rotation.interpolate({ inputRange: [-20, 20], outputRange: ['-20deg', '20deg'] }) }]
      }}
    >
      {char}
    </Animated.Text>
  );
};

// EmailSuggestions component - Fixed to not use FlatList
const EmailSuggestions = ({ emails, onEmailSelect, visible }) => {
  if (!visible || emails.length === 0) return null;

  return (
    <View style={styles.suggestionsContainer}>
      {emails.map((email, index) => (
        <TouchableOpacity
          key={index}
          style={styles.suggestionItem}
          onPress={() => onEmailSelect(email)}
        >
          <Icon name="envelope" size={16} color="#666" style={styles.suggestionIcon} />
          <Text style={styles.suggestionText}>{email}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const LoginScreen = ({ navigation }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [savedEmails, setSavedEmails] = useState([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);

  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const { login: authLogin } = useAuth();

  // Initialize component
  useEffect(() => {
    loadSavedEmails();
    generateCaptcha();
  }, []);

  const loadSavedEmails = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedEmails');
      if (saved) {
        setSavedEmails(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Error loading saved emails:', error);
    }
  };

  const saveEmail = async (email) => {
    try {
      if (email && !savedEmails.includes(email)) {
        const updatedEmails = [...savedEmails, email];
        setSavedEmails(updatedEmails);
        await AsyncStorage.setItem('savedEmails', JSON.stringify(updatedEmails));
      }
    } catch (error) {
      console.log('Error saving email:', error);
    }
  };

  const generateCaptcha = () => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    let result = '';
    const length = Math.random() > 0.5 ? 6 : 7;
    for (let i = 0; i < length; i++) {
      if (i === 4 && length === 7) result += '-';
      else result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setCaptchaText(result);
    setUserCaptcha('');
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const handleEmailSelect = (email) => {
    setLogin(email);
    setShowEmailSuggestions(false);
  };

  const handleLogin = async () => {
    if (!login || !password) {
      Alert.alert('Error', 'Please enter both login and password');
      shake();
      return;
    }

    if (userCaptcha.toLowerCase() !== captchaText.toLowerCase()) {
      Alert.alert('Error', 'Please enter the correct CAPTCHA');
      shake();
      generateCaptcha();
      return;
    }

    setIsLoading(true);

    try {
      const result = await authLogin(login, password);
      console.log("Login result:", result);

      if (result.success) {
        // Save email to suggestions when remember me is checked
        if (rememberMe) {
          await saveEmail(login);
        }
        
        const role = parseInt(result.user?.role);
        console.log("User role:", role);

        const dashboards = {
          1: "AdminDashboard",
          2: "UserDashboard",
          3: "ResolverDashboard",
          4: "AssignerDashboard"
        };

        const targetScreen = dashboards[role];

        if (!targetScreen) {
          Alert.alert("Navigation Error", "Dashboard not found for your role");
          generateCaptcha();
          return;
        }

        navigation.reset({
          index: 0,
          routes: [{ name: targetScreen }],
        });

      } else {
        const firstError = Object.values(result.errors || {})[0]?.[0] || result.message;
        Alert.alert('Login Failed', firstError);
        generateCaptcha();
      }

    } catch (err) {
      console.error("Login exception:", err);
      Alert.alert('Login Failed', 'Something went wrong. Please try again.');
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmails = savedEmails.filter(email => 
    email.toLowerCase().includes(login.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* Background Image Container */}
      <ImageBackground 
        source={require('../assets/images/LoginArfa.jpg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient 
          colors={['rgba(44, 62, 80, 0.7)', '#3b9b94ff']} 
          style={styles.overlay}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../assets/images/PITBLOGO.png')} 
                  style={styles.pitbLogo} 
                  resizeMode="contain" 
                />
                <Image 
                  source={require('../assets/images/crp.png')} 
                  style={styles.crpLogo} 
                  resizeMode="contain" 
                />
              </View>
              <Text style={styles.welcomeTitle}>Change Request Portal</Text>
              <Text style={styles.welcomeSubtitle}>Government of the Punjab</Text>
            </View>

            {/* Login Card - Now with transparent background to show image behind */}
            <Animated.View style={[styles.cardContainer, { transform: [{ translateX: shakeAnimation }] }]}>
              <View style={styles.card}>
                <View style={styles.header}>
                  <Text style={styles.title}>Sign In to CRP</Text>
                  <Text style={styles.subtitle}>Access Your Change Request Portal</Text>
                </View>

                {/* Email Input with Suggestions */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Icon name="user" size={20} color={Colors.secondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email or CNIC"
                      placeholderTextColor="#666"
                      value={login}
                      onChangeText={setLogin}
                      onFocus={() => setShowEmailSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowEmailSuggestions(false), 200)}
                      autoCapitalize="none"
                    />
                  </View>

                  <EmailSuggestions
                    emails={filteredEmails}
                    onEmailSelect={handleEmailSelect}
                    visible={showEmailSuggestions && filteredEmails.length > 0}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Icon name="lock" size={20} color={Colors.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Icon name={showPassword ? 'eye-slash' : 'eye'} size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Remember Me */}
                <View style={styles.rememberMeContainer}>
                  <TouchableOpacity 
                    style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    {rememberMe && <Icon name="check" size={12} color="#fff" />}
                  </TouchableOpacity>
                  <Text style={styles.rememberMeText}>Remember me</Text>
                </View>

                {/* CAPTCHA */}
                <View style={styles.captchaContainer}>
                  <View style={styles.captchaHeader}>
                    <Text style={styles.captchaTitle}>SECURITY VERIFICATION</Text>
                  </View>
                  <View style={styles.captchaDisplay}>
                    <View style={styles.captchaTextContainer}>
                      {captchaText.split('').map((char, index) => (
                        <WigglyChar key={index} char={char} />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.captchaInstruction}>Type the code you see above:</Text>
                  <View style={styles.captchaInputWrapper}>
                    <TextInput
                      style={styles.captchaInput}
                      placeholder="Enter CAPTCHA"
                      placeholderTextColor="#666"
                      value={userCaptcha}
                      onChangeText={setUserCaptcha}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity onPress={generateCaptcha} style={styles.refreshButton}>
                      <Icon name="refresh" size={16} color={Colors.primary} />
                      <Text style={styles.refreshText}>New Code</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.loginButtonGradient}>
                    {isLoading ? <ActivityIndicator color={Colors.accent} size="small" /> : <Text style={styles.loginButtonText}>Sign In</Text>}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotPasswordContainer}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerContent}>
              <View style={styles.footerLogoContainer}>
                <Image 
                  source={require('../assets/images/PITBLOGO.png')} 
                  style={styles.footerLogo} 
                  resizeMode="contain" 
                />
                <Text style={styles.footerText}>A project of Government of the Punjab</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(78, 205, 197, 0.2)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  pitbLogo: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  crpLogo: {
    width: 80,
    height: 60,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 3,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  cardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 30 
  },
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#4ECDC4',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: { 
    fontSize: 14, 
    color: '#666',
    textAlign: 'center',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  input: { 
    flex: 1, 
    color: '#333',
    fontSize: 16, 
    paddingVertical: 12,
  },
  inputIcon: { marginRight: 10 },
  suggestionsContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    maxHeight: 150,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 3,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  checkboxChecked: {
    backgroundColor: "#4ECDC4",
    borderColor: '#666',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#666',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  captchaContainer: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  captchaHeader: {
    marginBottom: 10,
  },
  captchaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ECDC4  ',
    textAlign: 'center',
  },
  captchaDisplay: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4ECDC4  ',
    borderStyle: 'dashed',
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  captchaTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captchaInstruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  captchaInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  captchaInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
    fontSize: 16,
    marginRight: 10,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  loginButton: { 
    height: 56, 
    borderRadius: 12, 
    overflow: 'hidden', 
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loginButtonText: { 
    color: Colors.accent, 
    fontSize: 18, 
    fontWeight: '600' 
  },
  footer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 15,
  },
  footerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  footerLogo: {
    width: 25,
    height: 25,
  },
  footerText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;