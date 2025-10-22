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
  ActivityIndicator
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '../styles/theme';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const { login: authLogin } = useAuth();

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

  useEffect(() => { generateCaptcha(); }, []);

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
    }, []);

    return (
      <Animated.Text
        style={{
          fontSize: 32,
          fontWeight: 'bold',
          color: '#2a5298',
          marginHorizontal: 2,
          fontFamily: 'monospace',
          transform: [{ rotate: rotation.interpolate({ inputRange: [-20, 20], outputRange: ['-20deg', '20deg'] }) }]
        }}
      >
        {char}
      </Animated.Text>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Navbar - Same as WelcomeScreen */}
      <View style={styles.navbar}>
        <View style={styles.navbarContent}>
          {/* Logo Section - Same as WelcomeScreen */}
          <TouchableOpacity style={styles.logoContainer}>
            <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.logoGradient}>
              <View style={styles.logosWrapper}>
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
            </LinearGradient>
          </TouchableOpacity>

          {/* Navigation Links - Same as WelcomeScreen */}
          <View style={styles.navLinks}>
            <TouchableOpacity onPress={() => navigation.navigate('Welcome', { scrollTo: 'services' })} style={styles.navButton}>
              <Text style={styles.navButtonText}>Services</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => navigation.navigate('Welcome', { scrollTo: 'projects' })} style={styles.navButton}>
              <Text style={styles.navButtonText}>Projects</Text>
            </TouchableOpacity>
            
            <TouchableOpacity>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.signInButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.signInButtonText}>Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Login */}
      <LinearGradient colors={[Colors.dark, Colors.primary, Colors.dark]} style={styles.background}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.signInContainer}>
            <Animated.View style={[styles.cardContainer, { transform: [{ translateX: shakeAnimation }] }]}>
              <LinearGradient colors={['#ffffff', '#f8f9fa', '#ffffff']} style={styles.cardGradient}>

                <View style={styles.header}>
                  <Text style={styles.title}>Sign In to CRP</Text>
                  <Text style={styles.subtitle}>Access Your Change Request Portal</Text>
                </View>

                <View style={styles.inputWrapper}>
                  <Icon name="user" size={20} color={Colors.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email or CNIC"
                    placeholderTextColor="#666"
                    value={login}
                    onChangeText={setLogin}
                    autoCapitalize="none"
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

                {/* CAPTCHA */}
                <View style={styles.captchaContainer}>
                  <View style={styles.captchaHeader}>
                    <Text style={styles.captchaTitle}>SECURITY VERIFICATION</Text>
                  </View>
                  <View style={styles.captchaDisplay}>
                    <View style={styles.captchaTextContainer}>
                      {captchaText.split('').map((char, index) => <WigglyChar key={index} char={char} />)}
                    </View>
                  </View>
                  <Text style={styles.captchaInstruction}>Type the code you see above:</Text>
                  <View style={styles.captchaInputWrapper}>
                    <TextInput
                      style={styles.captchaInput}
                      placeholder="Enter CAPTCHA code"
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

              </LinearGradient>
            </Animated.View>
          </View>
        </ScrollView>

        {/* Footer - Same as WelcomeScreen */}
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  
  // Navbar Styles - Same as WelcomeScreen
  navbar: { 
    backgroundColor: Colors.white, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e0e0e0', 
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  navbarContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  logoContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  logoGradient: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  logosWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pitbLogo: {
    width: 35,
    height: 35,
    marginRight: 10,
  },
  crpLogo: {
    width: 45,
    height: 35,
  },
  navLinks: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  navButton: { 
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginLeft: 8,
  },
  navButtonText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: Colors.primary,
  },
  signInButton: {
    borderRadius: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginLeft: 12,
  },
  signInButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },

  // Main Content Styles (unchanged)
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  cardGradient: {
    padding: 30,
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 30 
  },
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#2a5298',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: { 
    fontSize: 14, 
    color: '#666',
    textAlign: 'center',
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
    color: '#2a5298',
    textAlign: 'center',
  },
  captchaDisplay: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2a5298',
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

  // Footer Styles - Same as WelcomeScreen
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