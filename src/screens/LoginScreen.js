import React, { useState, useRef } from 'react';
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
  Image
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '../styles/theme';

const LoginScreen = ({ navigation }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    level: 0,
    message: '',
    color: '#ff4757'
  });
  const [passwordMatch, setPasswordMatch] = useState(true);

  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Generate random CAPTCHA
  const generateCaptcha = () => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    let result = '';
    const length = Math.random() > 0.5 ? 6 : 7;
    for (let i = 0; i < length; i++) {
      if (i === 4 && length === 7) {
        result += '-';
      } else {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
    }
    setCaptchaText(result);
    setUserCaptcha('');
  };

  // Password strength checker
  const checkPasswordStrength = (text) => {
    setPassword(text);
    checkPasswordMatch(text, confirmPassword);
    
    let strength = 0;
    let message = '';
    let color = '#ff4757';

    if (text.length >= 8) strength++;
    if (text.match(/[a-z]+/)) strength++;
    if (text.match(/[A-Z]+/)) strength++;
    if (text.match(/[0-9]+/)) strength++;
    if (text.match(/[!@#$%^&*(),.?":{}|<>]+/)) strength++;

    switch (strength) {
      case 0:
      case 1:
        message = 'Very Weak';
        color = '#ff4757';
        break;
      case 2:
        message = 'Weak';
        color = '#ffa502';
        break;
      case 3:
        message = 'Medium';
        color = '#ffa502';
        break;
      case 4:
        message = 'Strong';
        color = '#2ed573';
        break;
      case 5:
        message = 'Very Strong';
        color = '#2ed573';
        break;
    }

    setPasswordStrength({
      level: strength,
      message,
      color
    });
  };

  // Check if passwords match
  const checkPasswordMatch = (pass, confirmPass) => {
    if (confirmPass.length > 0) {
      setPasswordMatch(pass === confirmPass);
    } else {
      setPasswordMatch(true);
    }
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    checkPasswordMatch(password, text);
  };

  // Shake animation for invalid inputs
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const handleLogin = () => {
    if (!login || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      shake();
      return;
    }

    if (!passwordMatch) {
      Alert.alert('Error', 'Passwords do not match');
      shake();
      return;
    }

    if (userCaptcha.toLowerCase() !== captchaText.toLowerCase()) {
      Alert.alert('Error', 'Please enter the correct CAPTCHA');
      shake();
      generateCaptcha();
      return;
    }

    if (passwordStrength.level < 3) {
      Alert.alert('Weak Password', 'Please use a stronger password for security');
      return;
    }

    navigation.navigate('Dashboard', { userName: login });
  };

  // Initialize CAPTCHA on component mount
  React.useEffect(() => {
    generateCaptcha();
  }, []);

  // Fixed Wiggly CAPTCHA Character Component without width animation
  const WigglyChar = ({ char, index }) => {
    const rotation = useRef(new Animated.Value(Math.random() * 20 - 10)).current;

    React.useEffect(() => {
      const animate = () => {
        Animated.sequence([
          Animated.timing(rotation, {
            toValue: Math.random() * 40 - 20,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rotation, {
            toValue: Math.random() * 40 - 20,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]).start(() => animate());
      };
      animate();
    }, []);

    return (
      <Animated.Text
        style={[
          styles.captchaChar,
          {
            transform: [
              { 
                rotate: rotation.interpolate({
                  inputRange: [-20, 20],
                  outputRange: ['-20deg', '20deg']
                }) 
              }
            ]
          }
        ]}
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
      
      {/* Fixed Navbar - Exactly as you specified */}
      <View style={styles.navbar}>
        <View style={styles.navbarContent}>
          {/* Logo Container with Gradient */}
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.logoContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Image 
              source={require('../assets/images/crp.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.navbarTitle}>Change Request Portal</Text>
          </LinearGradient>

          {/* Navigation Links */}
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

      {/* Main Content - Your existing login screen */}
      <LinearGradient
        colors={[Colors.dark, Colors.primary, Colors.dark]}
        style={styles.background}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Sign In Container */}
          {/* Sign In Container */}
<View style={styles.signInContainer}>
  <Animated.View style={[styles.cardContainer, { transform: [{ translateX: shakeAnimation }] }]}>
    <LinearGradient
      colors={['#ffffff', '#f8f9fa', '#ffffff']}
      style={styles.cardGradient}
    >
      
      {/* Logo */}
      <View style={styles.logoContainerCard}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.logoCircleCard}
        >
          <Image 
            source={require('../assets/images/crp.png')}
            style={styles.loginCardLogo}
            resizeMode="contain"
          />
        </LinearGradient>
      </View>

      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.title}>Sign In to CRP</Text>
        <Text style={styles.subtitle}>Access Your Change Request Portal</Text>
      </View>

      {/* Rest of your existing code remains the same... */}
                {/* Email / CNIC */}
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

                {/* Password with strength indicator */}
                <View style={styles.inputWrapper}>
                  <Icon name="lock" size={20} color={Colors.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Strong Password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={checkPasswordStrength}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Icon
                      name={showPassword ? 'eye-slash' : 'eye'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBar}>
                      <View 
                        style={[
                          styles.strengthFill, 
                          { 
                            width: `${(passwordStrength.level / 5) * 100}%`,
                            backgroundColor: passwordStrength.color
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                      Strength: {passwordStrength.message}
                      {passwordStrength.level >= 3 && ' ✓'}
                    </Text>
                  </View>
                )}

                {/* Confirm Password */}
                <View style={[styles.inputWrapper, !passwordMatch && styles.inputError]}>
                  <Icon name="lock" size={20} color={!passwordMatch ? '#ff4757' : Colors.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Strong Password"
                    placeholderTextColor="#666"
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Icon
                      name={showConfirmPassword ? 'eye-slash' : 'eye'}
                      size={20}
                      color={!passwordMatch ? '#ff4757' : '#666'}
                    />
                  </TouchableOpacity>
                </View>

                {!passwordMatch && confirmPassword.length > 0 && (
                  <Text style={styles.errorText}>Passwords do not match</Text>
                )}

                {/* CAPTCHA Section with Wiggly Text */}
                <View style={styles.captchaContainer}>
                  <View style={styles.captchaHeader}>
                    <Text style={styles.captchaTitle}>SECURITY VERIFICATION</Text>
                  </View>
                  
                  <View style={styles.captchaDisplay}>
                    <View style={styles.captchaTextContainer}>
                      {captchaText.split('').map((char, index) => (
                        <WigglyChar key={index} char={char} index={index} />
                      ))}
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

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    style={styles.loginButtonGradient}
                  >
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Footer inside card */}
                <Text style={styles.cardFooterText}>
                  By signing in, you agree to our{' '}
                  <Text style={styles.link}>Terms of Service</Text> and{' '}
                  <Text style={styles.link}>Privacy Policy</Text>.
                </Text>
              </LinearGradient>
            </Animated.View>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Footer - Exactly as you specified */}
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.footer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.footerContent}>
          <Image 
            source={require('../assets/images/crp.png')}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={styles.footerText}>
            A project of Government of the Punjab
          </Text>
        </View>
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