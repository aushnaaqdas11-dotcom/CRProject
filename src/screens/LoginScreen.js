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
      const role = parseInt(result.user?.role); // <-- ensure number
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

      // Navigate to dashboard
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

      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navbarContent}>
          <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.logoContainer}>
            <Image source={require('../assets/images/crp.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.navbarTitle}>Change Request Portal</Text>
          </LinearGradient>
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
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  
  // Navbar Styles - Exactly as you specified
  navbar: {
   backgroundColor: Colors.white, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e0e0e0', 
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 9,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logo: {
    width: 40,
    height: 30,
    marginRight: 10,
  },
  navbarTitle: {
   fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  signInButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  signInButtonText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Your existing styles remain exactly the same
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
  logoContainerCard: { 
    alignItems: 'center', 
    marginBottom: 20 
  },
   loginCardLogo: {
    width: 40,
    height: 40,
  },
  logoCircleCard: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
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
  inputError: {
    borderColor: '#ff4757',
    borderWidth: 1,
  },
  input: { 
    flex: 1, 
    color: '#333',
    fontSize: 16, 
    paddingVertical: 12,
  },
  inputIcon: { marginRight: 10 },
  strengthContainer: {
    marginBottom: 16,
  },
  strengthBar: {
    height: 6,
    backgroundColor: '#f1f1f1',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorText: {
    color: '#ff4757',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 16,
    marginLeft: 10,
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
  captchaChar: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2a5298',
    marginHorizontal: 2,
    fontFamily: 'monospace',
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
  forgotPassword: { 
    alignSelf: 'flex-end', 
    marginBottom: 25,
  },
  forgotPasswordText: { 
    color: Colors.secondary, 
    fontSize: 14,
    fontWeight: '500',
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
  cardFooterText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  link: { 
    color: Colors.secondary, 
    fontWeight: '500' 
  },

  // Footer Styles - Exactly as you specified
  footer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLogo: {
    width: 50, // Adjust size as needed
    height: 24,
    tintColor: Colors.white,
    marginRight: 12, // Space between logo and text
  },
  footerText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginScreen;