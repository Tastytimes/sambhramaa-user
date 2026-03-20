import { Preferences } from '@capacitor/preferences';


export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    await Preferences.set({
      key,
      value,
    });
  } catch (error) {
    console.error('Error setting item in storage:', error);
  }
};
export const getItem = async (key: string): Promise<string | null> => {
  try {
    const { value } = await Preferences.get({ key });
    return value;
  } catch (error) {
    console.error('Error getting item from storage:', error);
    return null;
  }
};
export const removeItem = async (key: string): Promise<void> => {
  try {
    await Preferences.remove({ key });
  } catch (error) {
    console.error('Error removing item from storage:', error);
  }
};
export const clearStorage = async (): Promise<void> => {
  try {
    await Preferences.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};
