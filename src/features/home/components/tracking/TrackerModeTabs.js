import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../../../theme/colors';

export default function TrackerModeTabs({ options, value, onChange }) {
  return (
    <View style={styles.wrap}>
      {options.map(option => {
        const active = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.85}
          >
            {option.icon ? (
              <MaterialCommunityIcons
                name={option.icon}
                size={20}
                color={active ? colors.textPrimary : '#5B646E'}
                style={styles.tabIcon}
              />
            ) : null}
            <Text
              style={[styles.tabText, active && styles.tabTextActive]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  tab: {
    flex: 1,
    minHeight: 58,
    borderRadius: 14,
    backgroundColor: '#F4F6F8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#D8EEE9',
    borderColor: '#B8DED5',
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B646E',
    textAlign: 'center',
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
});
