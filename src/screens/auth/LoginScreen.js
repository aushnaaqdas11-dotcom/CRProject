  import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    ImageBackground,
  } from 'react-native';
  import * as Keychain from 'react-native-keychain';
  import LinearGradient from 'react-native-linear-gradient';
  import Icon from 'react-native-vector-icons/FontAwesome';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { Colors } from '../../styles/theme';
  import { useAuth } from '../../hooks/redux';
  import apiService from '../../services/apiService';
  import Footer from '../../components/Footer'; // Add this import


  // EmailSuggestions component
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
            <Icon
              name="envelope"
              size={16}
              color="#666"
              style={styles.suggestionIcon}
            />
            <Text style={styles.suggestionText}>{email}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const LoginScreen = ({ navigation }) => {
    // State declarations
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [captchaText, setCaptchaText] = useState('');
    const [captchaImage, setCaptchaImage] = useState(null);
    const [captchaKey, setCaptchaKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCaptcha, setIsLoadingCaptcha] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [savedEmails, setSavedEmails] = useState([]);
    const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);

    // Refs
    const shakeAnimation = useRef(new Animated.Value(0)).current;
    const emailInputRef = useRef(null);
    const passwordInputRef = useRef(null);
    const captchaInputRef = useRef(null);

    // Auth hook
    const { login: authLogin } = useAuth();

    // Load saved credentials from Keychain
    const loadSavedCredentials = useCallback(async () => {
      try {
        const savedEmailsData = await Keychain.getInternetCredentials('savedEmails');
        if (savedEmailsData) {
          setSavedEmails(JSON.parse(savedEmailsData.password));
        }

        const credentials = await Keychain.getGenericPassword();
        if (credentials) {
          setLogin(credentials.username);
          setPassword(credentials.password);
          setRememberMe(true);
        }
      } catch (error) {
        console.log('Error loading saved credentials:', error);
      }
    }, []);

    // Save credentials to Keychain
    const saveCredentials = useCallback(async (email, password) => {
      try {
        if (email && password) {
          await Keychain.setGenericPassword(email, password, {
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          });

          await Keychain.setInternetCredentials('crp-portal', email, password, {
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          });

          await saveEmailToSuggestions(email);
        }
      } catch (error) {
        console.log('Error saving credentials:', error);
      }
    }, []);

    // Save email to suggestions
    const saveEmailToSuggestions = useCallback(
      async email => {
        try {
          if (email && !savedEmails.includes(email)) {
            const updatedEmails = [...savedEmails, email];
            setSavedEmails(updatedEmails);

            await Keychain.setInternetCredentials(
              'savedEmails',
              'savedEmails',
              JSON.stringify(updatedEmails),
            );
          }
        } catch (error) {
          console.log('Error saving email to suggestions:', error);
        }
      },
      [savedEmails],
    );

    // Clear saved credentials
    const clearSavedCredentials = useCallback(async () => {
      try {
        await Keychain.resetGenericPassword();
        if (login) {
          await Keychain.resetInternetCredentials('crp-portal');
        }
      } catch (error) {
        console.log('Error clearing credentials:', error);
      }
    }, [login]);

    // Generate CAPTCHA from server
    const generateCaptcha = useCallback(async () => {
      try {
        setIsLoadingCaptcha(true);
        const response = await apiService.auth.getCaptcha();

        console.log('CAPTCHA response:', response.data);

        if (response.data) {
          if (response.data.captcha && response.data.key) {
            setCaptchaKey(response.data.key);
            setCaptchaText('');
            setCaptchaImage(response.data.captcha);
          } else if (response.data.captcha && !response.data.key) {
            setCaptchaKey(response.data.captcha);
            setCaptchaText('');
            setCaptchaImage(response.data.captcha);
          }
        }
      } catch (error) {
        console.error('Error fetching CAPTCHA:', error);
        Alert.alert('Error', 'Failed to load CAPTCHA. Please try again.');

        const fallbackCaptcha = Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();
        setCaptchaKey(fallbackCaptcha);
        setCaptchaImage(fallbackCaptcha);
      } finally {
        setIsLoadingCaptcha(false);
      }
    }, []);

    // Shake animation
    const shake = useCallback(() => {
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, [shakeAnimation]);

    // Handle email selection from suggestions
    const handleEmailSelect = useCallback(email => {
      setLogin(email);
      setShowEmailSuggestions(false);
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
    }, []);

    // Handle email typing
    const handleEmailChange = useCallback(text => {
      setLogin(text);
    }, []);

    // Handle remember me toggle
    const handleRememberMeToggle = useCallback(async () => {
      const newRememberMe = !rememberMe;
      setRememberMe(newRememberMe);

      if (!newRememberMe) {
        await clearSavedCredentials();
        setPassword('');
      }
    }, [rememberMe, clearSavedCredentials]);

    // Handle login - FINAL FIXED VERSION
  // Handle login - UPDATED VERSION
  const handleLogin = useCallback(async () => {
    if (!login || !password) {
      Alert.alert('Error', 'Please enter both login and password');
      shake();
      return;
    }

    if (!captchaText) {
      Alert.alert('Error', 'Please enter the CAPTCHA');
      shake();
      captchaInputRef.current?.focus();
      return;
    }

    if (!captchaKey) {
      Alert.alert('Error', 'Please refresh CAPTCHA first');
      generateCaptcha();
      return;
    }

    setIsLoading(true);

    try {
      console.log("=== SENDING TO API ===");
      console.log("Login:", login);
      console.log("Password length:", password?.length);
      console.log("CAPTCHA text:", captchaText);
      console.log("CAPTCHA key:", captchaKey);
      console.log("=== END SENDING DATA ===");

      // Make the API call
      const resultAction = await authLogin(login, password, captchaText, captchaKey);

      console.log('✅ Login action completed:', resultAction);
      
      // Check if it was fulfilled
      if (resultAction.type.endsWith('/fulfilled')) {
        console.log('✅ Login SUCCESSFUL via Redux!');
        
        // Get the token from response
        const token = resultAction.payload?.token;
        
        if (token) {
          // ✅ CRITICAL: Save token to AsyncStorage using apiService
          await apiService.setAuthToken(token);
          console.log('✅ Token saved to AsyncStorage');
        }
        
        // Remember me logic
        if (rememberMe) {
          await saveCredentials(login, password);
        } else {
          await clearSavedCredentials();
        }

        console.log('✅ Login successful! Auth state will update automatically.');
        
        // Generate new CAPTCHA for security
        setTimeout(() => {
          generateCaptcha();
        }, 1000);
        
      } else {
        console.error('❌ Login action returned but not fulfilled:', resultAction);
        
        // Extract error message
        let errorMessage = 'Something went wrong. Please try again.';
        if (resultAction.payload?.message) {
          errorMessage = resultAction.payload.message;
        }
        
        Alert.alert('Login Failed', errorMessage);
        generateCaptcha();
      }
      
    } catch (err) {
      console.error("=== LOGIN ERROR DETAILS ===");
      console.error("Error:", err);
      
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (err.payload) {
        const { message, errors } = err.payload;
        errorMessage = message || errorMessage;
        
        if (errors) {
          const allErrors = [];
          Object.entries(errors).forEach(([field, fieldErrors]) => {
            if (Array.isArray(fieldErrors)) {
              fieldErrors.forEach(error => allErrors.push(`${field}: ${error}`));
            }
          });
          
          if (allErrors.length > 0) {
            errorMessage = allErrors.join('\n');
          }
        }
      }
      
      Alert.alert('Login Failed', errorMessage);
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  }, [
    login,
    password,
    captchaText,
    captchaKey,
    rememberMe,
    authLogin,
    shake,
    saveCredentials,
    clearSavedCredentials,
    generateCaptcha,
  ]);

    // Initialize component - FIXED VERSION
  // Initialize component - UPDATED VERSION
  useEffect(() => {
    loadSavedCredentials();
    
    // Generate CAPTCHA on component mount
    // Always generate a fresh CAPTCHA when user visits login screen
    const initializeLoginScreen = async () => {
      try {
        console.log('🔄 Initializing login screen...');
        
        // Always generate new CAPTCHA for security
        console.log('🔐 Generating fresh CAPTCHA for login...');
        generateCaptcha();
        
        // Optional: Clear token if you want to force fresh login
        // await AsyncStorage.removeItem('api_token');
        
      } catch (error) {
        console.log('Error initializing login screen:', error);
        generateCaptcha();
      }
    };
    
    initializeLoginScreen();
  }, [loadSavedCredentials, generateCaptcha]);

    const filteredEmails = savedEmails.filter(email =>
      email.toLowerCase().includes(login.toLowerCase()),
    );

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

        <ImageBackground
          source={require('../../assets/images/LoginArfa.jpg')}
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
              <View style={styles.logoSection}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require('../../assets/images/PITBLOGO.png')}
                    style={styles.pitbLogo}
                    resizeMode="contain"
                  />
                  <Image
                    source={require('../../assets/images/crp.png')}
                    style={styles.crpLogo}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.welcomeTitle}>Change Request Portal</Text>
                <Text style={styles.welcomeSubtitle}>
                  Government of the Punjab
                </Text>
              </View>

              <Animated.View
                style={[
                  styles.cardContainer,
                  { transform: [{ translateX: shakeAnimation }] },
                ]}
              >
                <View style={styles.card}>
                  <View style={styles.header}>
                    <Text style={styles.title}>Sign In to CRP</Text>
                    <Text style={styles.subtitle}>
                      Access Your Change Request Portal
                    </Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <Icon
                        name="user"
                        size={20}
                        color={Colors.secondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        ref={emailInputRef}
                        style={styles.input}
                        placeholder="Email or CNIC"
                        placeholderTextColor="#666"
                        value={login}
                        onChangeText={handleEmailChange}
                        onFocus={() => setShowEmailSuggestions(true)}
                        onBlur={() =>
                          setTimeout(() => setShowEmailSuggestions(false), 200)
                        }
                        autoCapitalize="none"
                        autoComplete="email"
                        textContentType="emailAddress"
                        importantForAutofill="yes"
                        autoCorrect={false}
                        keyboardType="email-address"
                        returnKeyType="next"
                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                      />
                    </View>

                    <EmailSuggestions
                      emails={filteredEmails}
                      onEmailSelect={handleEmailSelect}
                      visible={showEmailSuggestions && filteredEmails.length > 0}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Icon
                      name="lock"
                      size={20}
                      color={Colors.secondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      ref={passwordInputRef}
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#666"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      textContentType="password"
                      importantForAutofill="yes"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => captchaInputRef.current?.focus()}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Icon
                        name={showPassword ? 'eye-slash' : 'eye'}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.rememberMeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.checkbox,
                        rememberMe && styles.checkboxChecked,
                      ]}
                      onPress={handleRememberMeToggle}
                    >
                      {rememberMe && <Icon name="check" size={12} color="#fff" />}
                    </TouchableOpacity>
                    <Text style={styles.rememberMeText}>Remember me</Text>
                  </View>

                  <View style={styles.captchaContainer}>
                    <View style={styles.captchaHeader}>
                      <Text style={styles.captchaTitle}>
                        SECURITY VERIFICATION
                      </Text>
                    </View>
                    <View style={styles.captchaDisplay}>
                      {isLoadingCaptcha ? (
                        <ActivityIndicator size="large" color={Colors.primary} />
                      ) : (
                        <Text style={styles.fallbackCaptcha}>
                          {captchaImage || captchaKey}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.captchaInstruction}>
                      Type the code you see above:
                    </Text>
                    <View style={styles.captchaInputWrapper}>
                      <TextInput
                        ref={captchaInputRef}
                        style={styles.captchaInput}
                        placeholder="Enter CAPTCHA"
                        placeholderTextColor="#666"
                        value={captchaText}
                        onChangeText={setCaptchaText}
                        autoCapitalize="characters"
                        autoComplete="off"
                        textContentType="none"
                        importantForAutofill="no"
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                      />
                      <TouchableOpacity
                        onPress={generateCaptcha}
                        style={styles.refreshButton}
                        disabled={isLoadingCaptcha}
                      >
                        <Icon
                          name={isLoadingCaptcha ? 'spinner' : 'refresh'}
                          size={16}
                          color={isLoadingCaptcha ? '#999' : Colors.primary}
                        />
                        <Text
                          style={[
                            styles.refreshText,
                            isLoadingCaptcha && styles.refreshTextDisabled,
                          ]}
                        >
                          New Code
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      isLoading && styles.loginButtonDisabled,
                    ]}
                    onPress={handleLogin}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={[Colors.primary, Colors.secondary]}
                      style={styles.loginButtonGradient}
                    >
                      {isLoading ? (
                        <ActivityIndicator color={Colors.accent} size="small" />
                      ) : (
                        <Text style={styles.loginButtonText}>Sign In</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.forgotPasswordContainer}>
                    <Text style={styles.forgotPasswordText}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </ScrollView>

            <Footer />
          </LinearGradient>
        </ImageBackground>
      </KeyboardAvoidingView>
    );
  };
  // Styles remain the same as in your original code
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    backgroundImage: {
      flex: 1,
    },
    overlay: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 40,
    },
    logoSection: {
      alignItems: 'center',
      marginBottom: 30,
    },
    logoContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    pitbLogo: {
      width: 120,
      height: 120,
      marginRight: 20,
    },
    crpLogo: {
      width: 120,
      height: 120,
    },
    welcomeTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
      textAlign: 'center',
      marginBottom: 8,
    },
    welcomeSubtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
    },
    cardContainer: {
      marginBottom: 30,
    },
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 20,
      padding: 25,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 10,
    },
    header: {
      marginBottom: 30,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: Colors.primary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: '#666',
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#e9ecef',
      paddingHorizontal: 15,
      marginBottom: 20,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      height: 50,
      fontSize: 16,
      color: '#333',
    },
    suggestionsContainer: {
      backgroundColor: '#fff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#e9ecef',
      marginTop: -15,
      marginBottom: 5,
      maxHeight: 150,
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#f8f9fa',
    },
    suggestionIcon: {
      marginRight: 10,
    },
    suggestionText: {
      fontSize: 14,
      color: '#666',
    },
    rememberMeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 25,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: Colors.primary,
      marginRight: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: Colors.primary,
    },
    rememberMeText: {
      fontSize: 14,
      color: '#666',
    },
    captchaContainer: {
      backgroundColor: '#f8f9fa',
      borderRadius: 12,
      padding: 20,
      marginBottom: 25,
    },
    captchaHeader: {
      marginBottom: 15,
    },
    captchaTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: Colors.primary,
      letterSpacing: 1,
    },
    captchaDisplay: {
      backgroundColor: '#fff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#e9ecef',
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
    },
    fallbackCaptcha: {
      fontSize: 32,
      fontWeight: 'bold',
      letterSpacing: 5,
      color: '#333',
    },
    captchaInstruction: {
      fontSize: 14,
      color: '#666',
      marginBottom: 10,
    },
    captchaInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    captchaInput: {
      flex: 1,
      height: 50,
      backgroundColor: '#fff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#e9ecef',
      paddingHorizontal: 15,
      fontSize: 16,
      marginRight: 10,
    },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#e9ecef',
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 8,
    },
    refreshText: {
      fontSize: 14,
      color: Colors.primary,
      marginLeft: 5,
    },
    refreshTextDisabled: {
      color: '#999',
    },
    loginButton: {
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 20,
    },
    loginButtonGradient: {
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loginButtonDisabled: {
      opacity: 0.7,
    },
    loginButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
    },
    forgotPasswordContainer: {
      alignItems: 'center',
    },
    forgotPasswordText: {
      fontSize: 14,
      color: Colors.primary,
      fontWeight: '500',
    },
 
});
  export default LoginScreen;