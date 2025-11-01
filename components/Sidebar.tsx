import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.7, 280);

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

export default function Sidebar({ visible, onClose }: SidebarProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const slideAnim = React.useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNavigation = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };

  const menuItems = [
    {
      id: 'ai-assistant',
      title: 'AI Advisor',
      icon: '🤖',
      description: 'Get personalized financial advice',
      route: '/(tabs)/ai-assistant',
    },
    {
      id: 'resources',
      title: 'Resources',
      icon: '📘',
      description: 'Financial education and tools',
      route: '/(tabs)/resources',
    },
  ];

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    sidebar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: SIDEBAR_WIDTH,
      backgroundColor: colors.cardBackground,
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    header: {
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 20,
      backgroundColor: colors.primary,
    },
    closeButton: {
      position: 'absolute',
      top: 55,
      right: 15,
      zIndex: 10,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 3,
    },
    headerSubtitle: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    menuContainer: {
      flex: 1,
      paddingTop: 10,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuIcon: {
      fontSize: 24,
      marginRight: 12,
      width: 30,
      textAlign: 'center',
    },
    menuTextContainer: {
      flex: 1,
    },
    menuTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 3,
    },
    menuDescription: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    menuArrow: {
      marginLeft: 10,
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerText: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Menu</Text>
            <Text style={styles.headerSubtitle}>Tools & Resources</Text>
          </View>

          <View style={styles.menuContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleNavigation(item.route)}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuDescription}>{item.description}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.menuArrow}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Budget Buddy v1.0</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}