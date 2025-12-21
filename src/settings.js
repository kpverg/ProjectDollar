import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { AppContext } from './AppContext';

const Settings = ({ onBack }) => {
  const {
    darkMode,
    setDarkMode,
    dateFormat,
    setDateFormat,
    colors,
    primaryColor,
    setPrimaryColor,
    colorPalettes,
  } = useContext(AppContext);
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: () => Alert.alert('Logged out', 'You have been logged out'),
      },
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.bg }]}
    >
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={[styles.backButtonText, { color: colors.primary }]}>
          ← Back
        </Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.bgSecondary }]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.primary, backgroundColor: colors.bg },
            ]}
          >
            Preferences
          </Text>

          <View
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Push Notifications
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Receive portfolio updates
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.border, true: '#a8d5ff' }}
              thumbColor={notifications ? colors.primary : '#f0f0f0'}
            />
          </View>

          <View
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Dark Mode
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Enable dark theme
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.border, true: '#a8d5ff' }}
              thumbColor={darkMode ? colors.primary : '#f0f0f0'}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.bgSecondary }]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.primary, backgroundColor: colors.bg },
            ]}
          >
            Color Theme
          </Text>

          <TouchableOpacity
            style={[
              styles.dropdownButton,
              {
                backgroundColor: colors.bg,
                borderColor: colors.border,
                borderBottomColor: colorDropdownOpen
                  ? colors.primary
                  : colors.border,
              },
            ]}
            onPress={() => setColorDropdownOpen(!colorDropdownOpen)}
          >
            <View style={styles.dropdownContent}>
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: colorPalettes[primaryColor] },
                ]}
              />
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                {primaryColor.charAt(0).toUpperCase() + primaryColor.slice(1)}
              </Text>
            </View>
            <Text style={[styles.dropdownArrow, { color: colors.primary }]}>
              {colorDropdownOpen ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {colorDropdownOpen && (
            <View
              style={[
                styles.dropdownList,
                { backgroundColor: colors.bg, borderColor: colors.border },
              ]}
            >
              {Object.entries(colorPalettes).map(([key, hex]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.dropdownItem,
                    {
                      backgroundColor:
                        primaryColor === key
                          ? colors.bgSecondary
                          : 'transparent',
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    setPrimaryColor(key);
                    setColorDropdownOpen(false);
                  }}
                >
                  <View style={[styles.colorDot, { backgroundColor: hex }]} />
                  <Text
                    style={[
                      styles.dropdownItemText,
                      {
                        color: colors.text,
                        fontWeight: primaryColor === key ? '700' : '500',
                      },
                    ]}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                  {primaryColor === key && (
                    <Text style={[styles.checkmark, { color: colors.primary }]}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.bgSecondary }]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.primary, backgroundColor: colors.bg },
            ]}
          >
            Date Format
          </Text>

          <TouchableOpacity
            style={[
              styles.dateFormatOption,
              {
                borderBottomColor: colors.border,
                backgroundColor:
                  dateFormat === 'DD-MM-YYYY' ? colors.bg : 'transparent',
              },
            ]}
            onPress={() => setDateFormat('DD-MM-YYYY')}
          >
            <Text
              style={[
                styles.dateFormatText,
                {
                  color: colors.text,
                  fontWeight: dateFormat === 'DD-MM-YYYY' ? '700' : '500',
                },
              ]}
            >
              DD-MM-YYYY
            </Text>
            {dateFormat === 'DD-MM-YYYY' && (
              <Text style={{ color: colors.primary, fontSize: 18 }}>✓</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dateFormatOption,
              {
                borderBottomColor: colors.border,
                backgroundColor:
                  dateFormat === 'YYYY-MM-DD' ? colors.bg : 'transparent',
              },
            ]}
            onPress={() => setDateFormat('YYYY-MM-DD')}
          >
            <Text
              style={[
                styles.dateFormatText,
                {
                  color: colors.text,
                  fontWeight: dateFormat === 'YYYY-MM-DD' ? '700' : '500',
                },
              ]}
            >
              YYYY-MM-DD
            </Text>
            {dateFormat === 'YYYY-MM-DD' && (
              <Text style={{ color: colors.primary, fontSize: 18 }}>✓</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.bgSecondary }]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.primary, backgroundColor: colors.bg },
            ]}
          >
            Security
          </Text>

          <View
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Two-Factor Authentication
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Extra security for your account
              </Text>
            </View>
            <Switch
              value={twoFactor}
              onValueChange={setTwoFactor}
              trackColor={{ false: colors.border, true: '#a8d5ff' }}
              thumbColor={twoFactor ? colors.primary : '#f0f0f0'}
            />
          </View>

          <TouchableOpacity
            style={[styles.settingButton, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.settingButtonText, { color: colors.primary }]}>
              Change Password
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.bgSecondary }]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.primary, backgroundColor: colors.bg },
            ]}
          >
            Account
          </Text>

          <TouchableOpacity
            style={[styles.settingButton, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.settingButtonText, { color: colors.primary }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingButton, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.settingButtonText, { color: colors.primary }]}>
              Privacy Policy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingButton, styles.dangerButton]}
            onPress={handleLogout}
          >
            <Text style={[styles.settingButtonText, styles.dangerText]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
    gap: 15,
  },
  section: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
  },
  settingButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateFormatOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  dateFormatText: {
    fontSize: 14,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    justifyContent: 'space-between',
  },
  colorOption: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 12,
    fontWeight: '600',
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  dropdownItemText: {
    fontSize: 14,
    flex: 1,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#d32f2f',
  },
});

export default Settings;
