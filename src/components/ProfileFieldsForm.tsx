import React from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';

export type ProfileFieldsValues = {
  displayName: string;
  bio: string;
  homeCity: string;
};

type ProfileFieldsFormProps = {
  title?: string;
  values: ProfileFieldsValues;
  onChangeDisplayName?: (value: string) => void;
  onChangeBio?: (value: string) => void;
  onChangeHomeCity?: (value: string) => void;
  /** When non-empty, the display name field cannot be edited (client-side only). */
  lockedDisplayName?: string | null;
  readOnly?: boolean;
  showActions?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  saving?: boolean;
  saveLabel?: string;
  error?: string | null;
  helperText?: string | null;
};

function ProfileFieldsForm({
  title,
  values,
  onChangeDisplayName,
  onChangeBio,
  onChangeHomeCity,
  lockedDisplayName,
  readOnly = false,
  showActions = false,
  onSave,
  onCancel,
  saving = false,
  saveLabel = 'Save',
  error,
  helperText,
}: ProfileFieldsFormProps) {
  const displayNameLocked =
    readOnly ||
    Boolean(lockedDisplayName != null && lockedDisplayName.trim().length > 0);

  if (readOnly) {
    return (
      <View style={styles.section}>
        {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
        <Text style={styles.profileName}>{values.displayName || '—'}</Text>
        {values.bio ? <Text style={styles.bio}>{values.bio}</Text> : null}
        {values.homeCity ? <Text style={styles.helper}>Home city: {values.homeCity}</Text> : null}
        {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      <TextInput
        style={[styles.input, displayNameLocked && styles.inputLocked]}
        value={values.displayName}
        onChangeText={onChangeDisplayName}
        placeholder="Display name"
        placeholderTextColor="#94A3B8"
        editable={!displayNameLocked}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        value={values.bio}
        onChangeText={onChangeBio}
        placeholder="Bio"
        placeholderTextColor="#94A3B8"
        multiline
      />
      <TextInput
        style={styles.input}
        value={values.homeCity}
        onChangeText={onChangeHomeCity}
        placeholder="Home city"
        placeholderTextColor="#94A3B8"
      />
      {showActions ? (
        <View style={styles.row}>
          <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : saveLabel}</Text>
          </Pressable>
          {onCancel ? (
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {error ? <Text style={styles.status}>{error}</Text> : null}
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  bio: {
    fontSize: 13,
    color: '#334155',
  },
  helper: {
    fontSize: 12,
    color: '#475569',
  },
  status: {
    fontSize: 12,
    color: '#1D4ED8',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  inputLocked: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ProfileFieldsForm;
