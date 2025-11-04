import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

class HapticsManager {
  private isSupported: boolean = false;
  private isEnabled: boolean = true;

  async init() {
    try {
      // Check if haptics is available
      this.isSupported = true;
    } catch (error) {
      console.log('Haptics not supported on this device');
      this.isSupported = false;
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  async light() {
    if (!this.isSupported || !this.isEnabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Silently fail if haptics not available
    }
  }

  async medium() {
    if (!this.isSupported || !this.isEnabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      // Silently fail if haptics not available
    }
  }

  async heavy() {
    if (!this.isSupported || !this.isEnabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      // Silently fail if haptics not available
    }
  }

  async success() {
    if (!this.isSupported || !this.isEnabled) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      // Silently fail if haptics not available
    }
  }

  async error() {
    if (!this.isSupported || !this.isEnabled) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      // Silently fail if haptics not available
    }
  }
}

export const hapticsManager = new HapticsManager();
