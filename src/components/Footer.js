import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const Footer = () => {
  return (
    <View style={styles.footer}>
      <View style={styles.footerRow}>
        <Image
          source={require('../assets/images/PITBLOGO.png')}
          style={styles.footerLogo}
          resizeMode="contain"
        />
        <Text style={styles.footerText}>
          A project of Government of the Punjab
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLogo: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontWeight: 'normal',
  },
});

export default Footer;