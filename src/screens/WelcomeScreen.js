import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  StatusBar,
  SafeAreaView,
  Linking,
  Image
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors } from '../styles/theme';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation, route }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  
  const scrollViewRef = useRef();
  const servicesRef = useRef();
  const projectsRef = useRef();
  const [sectionPositions, setSectionPositions] = useState({
    services: 0,
    projects: 0
  });

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim1, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim1, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim2, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim2, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Scroll to section if param passed
    if (route.params?.scrollTo) {
      setTimeout(() => {
        scrollToSection(route.params.scrollTo);
      }, 500);
    }
  }, [route.params]);

  const translateY1 = floatAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20]
  });

  const translateY2 = floatAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15]
  });

  // Store section positions when they layout
  const handleServicesLayout = (event) => {
    const layout = event.nativeEvent.layout;
    setSectionPositions(prev => ({
      ...prev,
      services: layout.y
    }));
  };

  const handleProjectsLayout = (event) => {
    const layout = event.nativeEvent.layout;
    setSectionPositions(prev => ({
      ...prev,
      projects: layout.y
    }));
  };

  const scrollToSection = (section) => {
    if (section === 'services' && sectionPositions.services > 0) {
      scrollViewRef.current.scrollTo({ 
        y: sectionPositions.services - 100, 
        animated: true 
      });
    } else if (section === 'projects' && sectionPositions.projects > 0) {
      scrollViewRef.current.scrollTo({ 
        y: sectionPositions.projects - 100, 
        animated: true 
      });
    }
  };

  const handleServicesPress = () => {
    scrollToSection('services');
  };

  const handleProjectsPress = () => {
    scrollToSection('projects');
  };

  const handleSignInPress = () => {
    navigation.navigate('Login');
  };

  // Stats Data
  const stats = [
    { number: '500+', label: 'Projects Managed', icon: 'shield' },
    { number: '200+', label: 'Happy Clients', icon: 'users' },
    { number: '98%', label: 'Satisfaction Rate', icon: 'line-chart' }
  ];

  // Services Data
  const services = [
    { 
      icon: 'database', 
      title: 'Database Management', 
      description: 'Expert resolution of database performance, integrity, and optimization challenges with cutting-edge solutions.' 
    },
    { 
      icon: 'server', 
      title: 'Domain / Hosting', 
      description: 'Comprehensive management of domain registration, DNS, and hosting infrastructure for optimal performance.' 
    },
    { 
      icon: 'code', 
      title: 'Module Development', 
      description: 'Custom development of innovative software modules to extend your system\'s capabilities and functionality.' 
    },
    { 
      icon: 'plug', 
      title: 'API Integration', 
      description: 'Seamless diagnosis and resolution of API integration challenges, performance issues, and security concerns.' 
    },
    { 
      icon: 'paint-brush', 
      title: 'Design Upgrade', 
      description: 'Modern UI/UX transformations that enhance user experience, aesthetics, and overall platform engagement.' 
    },
    { 
      icon: 'bar-chart', 
      title: 'Analytics & Reporting', 
      description: 'Advanced analytics and intelligent reporting solutions to track project changes and optimize performance metrics.' 
    }
  ];

  // Projects Data
  const projects = [
    { letter: 'D', name: 'DPMIS', description: 'A dynamic platform for managing project data with seamless integration and real-time updates.', url: 'https://dpmis.punjab.gov.pk/' },
    { letter: 'D', name: 'Dhee Rani', description: 'A culturally inspired initiative for empowering women through innovative technology solutions.', url: 'https://cmp.punjab.gov.pk/' },
    { letter: 'A', name: 'ADWC', description: 'A robust system for community welfare and development programs with comprehensive management tools.', url: 'https://adwc.punjab.gov.pk/' },
    { letter: 'S', name: 'Sanatzar', description: 'A creative hub for skill development and economic growth with advanced learning management features.' },
    { letter: 'H', name: 'Himmat Card', description: 'A robust system for community welfare and development programs with comprehensive management tools.' },
    { letter: 'E', name: 'Enabled', description: 'A comprehensive platform dedicated to providing resources, support, and services for people with disabilities, promoting inclusion and accessibility.', url: 'https://enabled.punjab.gov.pk/' }
  ];

  const openUrl = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
    

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Background Image */}
          <Image 
            source={require('../assets/images/banner.jpg')}
            style={styles.heroBackgroundImage}
            resizeMode="cover"
          />
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
            
          <Animated.View style={[styles.heroContent, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
            <Text style={styles.heroTitle}>
              Streamline Your{'\n'}
              <Text style={styles.heroTitleHighlight}>Project Changes</Text>
            </Text>
            
            <Text style={styles.heroSubtitle}>
              Transform your workflow with our cutting-edge platform designed for seamless project change management.
            </Text>
            
            <TouchableOpacity style={styles.heroButton} onPress={() => navigation.navigate('Login')}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary, Colors.primary]}
                style={styles.heroButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Icon name="rocket" size={20} color={Colors.white} />
                <Text style={styles.heroButtonText}>Request a Change</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.floatingElement, styles.floating1, { transform: [{ translateY: translateY1 }] }]} />
          <Animated.View style={[styles.floatingElement, styles.floating2, { transform: [{ translateY: translateY2 }] }]} />
       
        </LinearGradient>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <LinearGradient
                  colors={[Colors.secondary, Colors.primary]}
                  style={styles.statIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name={stat.icon} size={24} color={Colors.white} />
                </LinearGradient>
                <Text style={styles.statNumber}>{stat.number}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Services Section */}
        <LinearGradient
          colors={[Colors.accent, Colors.lightTeal]}
          style={styles.servicesSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View 
            onLayout={handleServicesLayout}
            style={styles.sectionContainer}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Our <Text style={styles.sectionTitleHighlight}>Services</Text>
              </Text>
              <Text style={styles.sectionSubtitle}>
                Comprehensive solutions designed to elevate your project management experience
              </Text>
            </View>

            <View style={styles.servicesGrid}>
              {services.map((service, index) => (
                <View key={index} style={styles.serviceCard}>
                  <LinearGradient
                    colors={[Colors.secondary, Colors.primary]}
                    style={styles.serviceIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Icon name={service.icon} size={24} color={Colors.white} />
                  </LinearGradient>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                  <TouchableOpacity style={styles.serviceLink}>
                    <Text style={styles.serviceLinkText}>Explore Service</Text>
                    <Icon name="arrow-right" size={14} color={Colors.secondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* Projects Section with Background Image */}
        <View style={styles.projectsSection}>
          {/* Background Image */}
          <Image 
            source={require('../assets/images/arfa.jpg')}
            style={styles.projectsBackgroundImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.91)', 'rgba(0, 0, 0, 0.81)']}
            style={styles.projectsOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View 
              onLayout={handleProjectsLayout}
              style={styles.sectionContainer}
            >
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: Colors.white }]}>
                  Featured <Text style={styles.sectionTitleHighlight}>Projects</Text>
                </Text>
                <Text style={[styles.sectionSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                  Discover our portfolio of innovative solutions and successful implementations
                </Text>
              </View>

              <View style={styles.projectsGrid}>
                {projects.map((project, index) => (
                  <TouchableOpacity key={index} style={styles.projectCard} onPress={() => project.url && openUrl(project.url)} activeOpacity={0.9}>
                    <View style={styles.projectIcon}>
                      <Text style={styles.projectLetter}>{project.letter}</Text>
                    </View>
                    <Text style={styles.projectName}>{project.name}</Text>
                    <Text style={styles.projectDescription}>{project.description}</Text>
                    <TouchableOpacity style={styles.projectButton} onPress={() => project.url && openUrl(project.url)}>
                      <Text style={styles.projectButtonText}>View Project</Text>
                      <Icon name="external-link" size={12} color={Colors.secondary} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Footer - Same as Login Screen */}
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.white 
  },
  // Fixed Navbar Styles - Same as Login Screen
  navbar: { 
    backgroundColor: Colors.white, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e0e0e0', 
    paddingHorizontal: 16,
    paddingTop: 42,
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
  pitbLogo: {
    width: 35,
    height: 35,
    marginRight: 10,
  },
  crpLogo: {
    width: 45,
    height: 35,
  },
  logosWrapper: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  navLinks: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  navButton: { 
    paddingHorizontal: 4,
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
  scrollView: { 
    flex: 1 
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: { 
    minHeight: height * 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    position: 'relative',
    overflow: 'hidden',
  },
  heroBackgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.1,
  },
  heroContent: { 
    alignItems: 'center', 
    zIndex: 2,
  },
  heroTitle: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: Colors.white, 
    textAlign: 'center', 
    lineHeight: 38, 
    marginBottom: 16 
  },
  heroTitleHighlight: { 
    color: Colors.lightTeal 
  },
  heroSubtitle: { 
    fontSize: 16, 
    color: 'rgba(255,255,255,0.9)', 
    textAlign: 'center', 
    lineHeight: 22, 
    marginBottom: 32, 
    maxWidth: 400 
  },
  heroButton: { 
    height: 50, 
    borderRadius: 25, 
    overflow: 'hidden', 
    shadowColor: Colors.primary, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 6 
  },
  heroButtonGradient: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 24 
  },
  heroButtonText: { 
    color: Colors.white, 
    fontSize: 16, 
    fontWeight: '600', 
    marginLeft: 8 
  },
  floatingElement: { 
    position: 'absolute', 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 50 
  },
  floating1: { 
    width: 60, 
    height: 60, 
    top: '20%', 
    left: '10%' 
  },
  floating2: { 
    width: 40, 
    height: 40, 
    bottom: '20%', 
    right: '10%' 
  },
  statsSection: { 
    backgroundColor: Colors.white, 
    paddingVertical: 40, 
    paddingHorizontal: 24 
  },
  statsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    maxWidth: 400, 
    alignSelf: 'center', 
    width: '100%' 
  },
  statItem: { 
    alignItems: 'center', 
    flex: 1 
  },
  statIcon: { 
    width: 50, 
    height: 50, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  statNumber: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: Colors.primary, 
    marginBottom: 4 
  },
  statLabel: { 
    fontSize: 12, 
    color: Colors.gray, 
    textAlign: 'center', 
    fontWeight: '500' 
  },
  servicesSection: { 
    paddingVertical: 60, 
    paddingHorizontal: 24 
  },
  // Projects Section with Background Image
  projectsSection: { 
    position: 'relative',
    minHeight: height * 0.8,
  },
  projectsBackgroundImage: {
    position: 'absolute',
    width: '190%',
    height: '120%',
  },
  projectsOverlay: {
    flex: 1,
    paddingVertical: 60,
    paddingHorizontal: 24,

    
  },
  sectionContainer: { 
    width: '100%', 
    alignSelf: 'center' 
  },
  sectionHeader: { 
    alignItems: 'center', 
    marginBottom: 40 
  },
  sectionTitle: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: Colors.dark, 
    textAlign: 'center', 
    marginBottom: 12 
  },
  sectionTitleHighlight: { 
    color: Colors.secondary 
  },
  sectionSubtitle: { 
    fontSize: 16, 
    color: Colors.gray, 
    textAlign: 'center', 
    maxWidth: 400, 
    lineHeight: 22 
  },
  servicesGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  serviceCard: { 
    width: '100%', 
    backgroundColor: Colors.white, 
    borderRadius: 12, 
    padding: 20, 
    marginBottom: 16, 
    shadowColor: Colors.dark, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 3 
  },
  serviceIcon: { 
    width: 50, 
    height: 50, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  serviceTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: Colors.dark, 
    marginBottom: 8 
  },
  serviceDescription: { 
    fontSize: 14, 
    color: Colors.gray, 
    lineHeight: 20, 
    marginBottom: 16 
  },
  serviceLink: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  serviceLinkText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: Colors.secondary, 
    marginRight: 8 
  },
  projectsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  projectCard: { 
    width: '100%', 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    borderRadius: 12, 
    padding: 20, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.2)' 
  },
  projectIcon: { 
    width: 50, 
    height: 50, 
    borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  projectLetter: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: Colors.white 
  },
  projectName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: Colors.white, 
    marginBottom: 8 
  },
  projectDescription: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.8)', 
    lineHeight: 20, 
    marginBottom: 16 
  },
  projectButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16, 
    alignSelf: 'flex-start' 
  },
  projectButtonText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: Colors.secondary, 
    marginRight: 6 
  },
  // Footer Styles - Same as Login Screen
  footer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 16,
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

export default WelcomeScreen;