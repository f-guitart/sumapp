/**
 * Profile management for addition and subtraction game
 * Handles profile creation, selection, and UI updates
 */

const Profiles = {
  /**
   * Get all available profiles
   */
  getAll() {
    return Storage.getProfiles();
  },

  /**
   * Get current profile
   */
  getCurrent() {
    const profileName = Storage.getCurrentProfile();
    if (!profileName) return null;
    return Storage.getProfile(profileName);
  },

  /**
   * Create a new profile
   */
  create(name) {
    if (!name || name.trim() === '') {
      throw new Error('Profile name cannot be empty');
    }

    const existingProfiles = this.getAll();
    if (existingProfiles[name]) {
      throw new Error('Profile name already exists');
    }

    const profile = Storage.createProfile(name);
    Storage.setCurrentProfile(name);
    return profile;
  },

  /**
   * Select an existing profile
   */
  select(name) {
    const profile = Storage.getProfile(name);
    if (!profile) {
      throw new Error('Profile not found');
    }
    Storage.setCurrentProfile(name);
    return profile;
  },

  /**
   * Get profile level
   */
  getLevel(profileName) {
    const profile = Storage.getProfile(profileName);
    return profile ? profile.level : 1;
  },

  /**
   * Get profile stats
   */
  getStats(profileName) {
    const profile = Storage.getProfile(profileName);
    return profile ? (profile.stats || {}) : {};
  },

  /**
   * Update profile level
   */
  updateLevel(profileName, newLevel) {
    Storage.updateProfileLevel(profileName, newLevel);
  },

  /**
   * Render profile selection UI
   */
  renderProfileSelection(container) {
    const profiles = this.getAll();
    const currentProfileName = Storage.getCurrentProfile();

    container.innerHTML = '';

    // Create profile list
    const profileList = document.createElement('div');
    profileList.className = 'profile-list';

    // Filter out admin profile from display
    const visibleProfiles = Object.keys(profiles).filter(name => !Analytics.isAdmin(name));

    if (visibleProfiles.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'empty-message';
      emptyMsg.textContent = 'No profiles yet. Create one to start!';
      profileList.appendChild(emptyMsg);
    } else {
      visibleProfiles.forEach(name => {
        const profileItem = document.createElement('div');
        profileItem.className = `profile-item ${name === currentProfileName ? 'active' : ''}`;
        
        const profileName = document.createElement('div');
        profileName.className = 'profile-name';
        profileName.textContent = name;
        
        const profileLevel = document.createElement('div');
        profileLevel.className = 'profile-level';
        profileLevel.textContent = `Level ${profiles[name].level}`;
        
        const selectBtn = document.createElement('button');
        selectBtn.className = 'btn btn-select';
        selectBtn.textContent = 'Select';
        selectBtn.onclick = () => {
          this.select(name);
          this.renderProfileSelection(container);
          if (window.onProfileSelected) {
            window.onProfileSelected();
          }
        };

        profileItem.appendChild(profileName);
        profileItem.appendChild(profileLevel);
        profileItem.appendChild(selectBtn);
        profileList.appendChild(profileItem);
      });
    }

    // Create new profile form
    const newProfileForm = document.createElement('div');
    newProfileForm.className = 'new-profile-form';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter profile name';
    input.className = 'profile-input';
    input.maxLength = 20;
    
    const createBtn = document.createElement('button');
    createBtn.className = 'btn btn-create';
    createBtn.textContent = 'Create New Profile';
    createBtn.onclick = () => {
      const name = input.value.trim();
      if (name) {
        try {
          // Special handling for admin profile
          if (Analytics.isAdmin(name)) {
            const existingProfiles = this.getAll();
            if (existingProfiles[name]) {
              // Admin already exists, just select it
              this.select(name);
            } else {
              // Create new admin profile
              this.create(name);
            }
            input.value = '';
            this.renderProfileSelection(container);
            if (window.onAdminSelected) {
              window.onAdminSelected();
            }
          } else {
            this.create(name);
            input.value = '';
            this.renderProfileSelection(container);
            if (window.onProfileSelected) {
              window.onProfileSelected();
            }
          }
        } catch (error) {
          alert(error.message);
        }
      }
    };

    // Allow Enter key to create profile
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        createBtn.click();
      }
    });

    newProfileForm.appendChild(input);
    newProfileForm.appendChild(createBtn);

    container.appendChild(profileList);
    container.appendChild(newProfileForm);
  }
};

