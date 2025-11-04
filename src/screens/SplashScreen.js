// screens/SplashScreen.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Easing,
  Text
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../styles/theme';
import { useAuth } from '../hooks/redux'; // Updated import

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  // Use useRef for animated values in functional components
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const particleAnim1 = useRef(new Animated.Value(0)).current;
  const particleAnim2 = useRef(new Animated.Value(0)).current;
  const particleAnim3 = useRef(new Animated.Value(0)).current;
  const textGlowAnim = useRef(new Animated.Value(0)).current;

  // Use Redux auth hook
  const { user, token, loading, loadUser } = useAuth();

  useEffect(() => {
    // Load user data from storage
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    // Enhanced animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(textGlowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false, // Set to false for text color animation
        }),
      ]),
      // Particle animations
      Animated.stagger(200, [
        Animated.timing(particleAnim1, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim2, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim3, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Navigate based on auth state after delay
    const timer = setTimeout(() => {
      if (token && user) {
        // User is logged in - navigate to appropriate dashboard
        const dashboards = {
          1: "AdminDashboard",
          2: "UserDashboard", 
          3: "ResolverDashboard",
          4: "AssignerDashboard"
        };
        const targetScreen = dashboards[parseInt(user.role)] || 'UserDashboard';
        navigation.replace(targetScreen);
      } else {
        // User is not logged in - navigate to Welcome
        navigation.replace('Welcome');
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, scaleAnim, slideAnim, rotateAnim, glowAnim, textGlowAnim, particleAnim1, particleAnim2, particleAnim3, token, user]);

  // ... (rest of the component remains exactly the same)
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowInterpolate = glowAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });

  const textGlowInterpolate = textGlowAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0.3],
  });

  const particle1Translate = particleAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });

  const particle2Translate = particleAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40],
  });

  const particle3Translate = particleAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -60],
  });

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary, Colors.dark]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar 
        barStyle="light-content" 
        translucent 
        backgroundColor="transparent" 
      />
      
      {/* Animated Background Elements */}
      <Animated.View 
        style={[
          styles.floatingCircle1,
          {
            opacity: fadeAnim,
            transform: [{ translateY: particle1Translate }]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.floatingCircle2,
          {
            opacity: fadeAnim,
            transform: [{ translateY: particle2Translate }]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.floatingCircle3,
          {
            opacity: fadeAnim,
            transform: [{ translateY: particle3Translate }]
          }
        ]} 
      />

      <View style={styles.content}>
        {/* Main Logo Container with Enhanced Effects */}
        <Animated.View
          style={[
            styles.logosContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ]
            }
          ]}
        >
          {/* Glow Effect */}
          <Animated.View 
            style={[
              styles.glowEffect,
              {
                opacity: glowInterpolate,
                transform: [{ scale: glowInterpolate.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2]
                }) }]
              }
            ]} 
          />

          {/* Logo Ring Animation */}
          <Animated.View 
            style={[
              styles.logoRing,
              {
                transform: [{ rotate: rotateInterpolate }]
              }
            ]} 
          />

          {/* PITB Logo */}
          <View style={styles.logoWrapper}>
            <Image
              source={require('../assets/images/PITBLOGO.png')}
              style={styles.pitbLogo}
              resizeMode="contain"
            />
            <Animated.View 
              style={[
                styles.logoShadow,
                {
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.3]
                  })
                }
              ]} 
            />
          </View>

          {/* Middle Separator */}
          <Animated.View 
            style={[
              styles.logoSeparator,
              {
                opacity: fadeAnim
              }
            ]} 
          >
            <View style={styles.separatorDot} />
            <View style={styles.separatorDot} />
            <View style={styles.separatorDot} />
          </Animated.View>

          {/* CRP Logo */}
          <View style={styles.logoWrapper}>
            <Image
              source={require('../assets/images/crp.png')}
              style={styles.crpLogo}
              resizeMode="contain"
            />
            <Animated.View 
              style={[
                styles.logoShadow,
                {
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.3]
                  })
                }
              ]} 
            />
          </View>
        </Animated.View>

        {/* Enhanced Text Container */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Text with Glow Effect Container */}
          <View style={styles.textGlowContainer}>
            <Animated.View 
              style={[
                styles.textGlowEffect,
                {
                  opacity: textGlowInterpolate
                }
              ]} 
            />
            <Animated.Text style={[
              styles.title,
              {
                // Using color animation instead of text shadow
                color: textGlowInterpolate.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [Colors.white, '#ffffff', '#e8f4f8']
                })
              }
            ]}>
              Change Request Portal
            </Animated.Text>
          </View>
          
          <Animated.Text style={[
            styles.subtitle,
            {
              opacity: textGlowInterpolate.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.9, 1, 0.95]
              })
            }
          ]}>
            Government of the Punjab
          </Animated.Text>

          {/* Tagline */}
          <Animated.Text style={[
            styles.tagline,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0, 1]
              })
            }
          ]}>
            Streamlining Digital Transformation
          </Animated.Text>
        </Animated.View>
      </View>

      {/* Enhanced Loading Indicator */}
      <View style={styles.loadingContainer}>
        <Animated.Text style={[
          styles.loadingText,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0, 1]
            })
          }
        ]}>
          Loading...
        </Animated.Text>
        
        <View style={styles.loadingBarBackground}>
          <Animated.View 
            style={[
              styles.loadingBar,
              {
                transform: [{
                  scaleX: fadeAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.5, 1]
                  })
                }]
              }
            ]} 
          />
        </View>

        {/* Loading Dots */}
        <View style={styles.loadingDots}>
          <Animated.View style={[
            styles.loadingDot,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 0.3, 0.6, 1],
                outputRange: [0, 1, 0, 1]
              })
            }
          ]} />
          <Animated.View style={[
            styles.loadingDot,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 0.4, 0.7, 1],
                outputRange: [0, 1, 0, 1]
              })
            }
          ]} />
          <Animated.View style={[
            styles.loadingDot,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 0.5, 0.8, 1],
                outputRange: [0, 1, 0, 1]
              })
            }
          ]} />
        </View>
      </View>

      {/* Footer */}
      <Animated.View 
        style={[
          styles.footer,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 0.7, 1],
              outputRange: [0, 0, 1]
            })
          }
        ]}
      >
        <Text style={styles.footerText}>
          PUNJAB INFORMATION TECHNOLOGY BOARD
        </Text>
      </Animated.View>
    </LinearGradient>
  );
};

// ... (styles remain exactly the same)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  content: {
    alignItems: 'center',
    marginBottom: 80,
    zIndex: 2,
  },
  // Floating Background Elements
  floatingCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: '20%',
    left: '10%',
  },
  floatingCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: '30%',
    right: '15%',
  },
  floatingCircle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    top: '60%',
    left: '20%',
  },
  // Logo Container Styles
  logosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoRing: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
  },
  logoWrapper: {
    marginHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pitbLogo: {
    width: width * 0.25,
    height: width * 0.25,
    zIndex: 2,
  },
  crpLogo: {
    width: width * 0.25,
    height: width * 0.25,
    zIndex: 2,
  },
  logoShadow: {
    position: 'absolute',
    width: width * 0.3,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    bottom: -15,
    zIndex: 1,
  },
  logoSeparator: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  separatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginVertical: 4,
  },
  // Text Styles with Glow Effects
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  textGlowContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGlowEffect: {
    position: 'absolute',
    width: '120%',
    height: '150%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    zIndex: -1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.5)', // Static shadow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 5,
  },
  // Loading Styles
  loadingContainer: {
    position: 'absolute',
    bottom: 120,
    width: width * 0.6,
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '500',
  },
  loadingBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 15,
  },
  loadingBar: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 3,
    width: '100%',
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 4,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
  },
});

export default SplashScreen;