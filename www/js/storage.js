// storage.js - localStorage persistence for game data

import { generateUUID } from './game.js';

export const STORAGE_KEY_PROFILES = "chess_profiles";
export const STORAGE_KEY_ACTIVE_PROFILE = "chess_active_profile";

export function getStorageItem(key) {
    try {
        return window.localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}

export function setStorageItem(key, value) {
    try {
        window.localStorage.setItem(key, value);
        return true;
    } catch (e) {
        return false;
    }
}

export function initializeProfile() {
    try {
        let profileId = getStorageItem(STORAGE_KEY_ACTIVE_PROFILE);
        let profilesJson = getStorageItem(STORAGE_KEY_PROFILES);
        let profiles = profilesJson ? JSON.parse(profilesJson) : [];

        let activeProfile = profileId ? profiles.find(p => p.id === profileId) || null : null;

        if (!activeProfile) {
            profileId = generateUUID();
            activeProfile = { id: profileId, name: "Player", created_at: Date.now() };
            profiles.push(activeProfile);
            setStorageItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
            setStorageItem(STORAGE_KEY_ACTIVE_PROFILE, profileId);
        }

        return activeProfile;
    } catch (e) {
        console.warn("Profile init failed:", e);
        return null;
    }
}

export function saveGame(currentGame) {
    if (!currentGame) return;
    try {
        const key = `chess_games_${currentGame.profile_id}`;
        let gamesJson = getStorageItem(key);
        let games = gamesJson ? JSON.parse(gamesJson) : [];

        games = games.filter(g => g.result !== "in_progress" || g.game_id === currentGame.game_id);

        const existingIdx = games.findIndex(g => g.game_id === currentGame.game_id);
        if (existingIdx >= 0) {
            games[existingIdx] = currentGame;
        } else {
            games.push(currentGame);
        }

        setStorageItem(key, JSON.stringify(games));
    } catch (e) {
        console.warn("Save game failed:", e);
    }
}

export function loadInProgressGame(profileId) {
    if (!profileId) return null;
    try {
        const key = `chess_games_${profileId}`;
        const gamesJson = getStorageItem(key);
        if (!gamesJson) return null;

        const games = JSON.parse(gamesJson);
        let inProgress = null;

        for (const game of games) {
            if (game.result === "in_progress" && (!inProgress || game.last_modified > inProgress.last_modified)) {
                inProgress = game;
            }
        }
        return inProgress;
    } catch (e) {
        return null;
    }
}

export function exportHistory(profileId) {
    if (!profileId) return;
    const key = `chess_games_${profileId}`;
    const gamesJson = getStorageItem(key);
    const games = gamesJson ? JSON.parse(gamesJson) : [];
    const blob = new Blob([JSON.stringify({ version: 1, profile: { id: profileId, name: "Player", created_at: Date.now() }, games }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export function getAllProfiles() {
    try {
        const profilesJson = getStorageItem(STORAGE_KEY_PROFILES);
        return profilesJson ? JSON.parse(profilesJson) : [];
    } catch (e) {
        return [];
    }
}

export function switchProfile(profileId) {
    try {
        setStorageItem(STORAGE_KEY_ACTIVE_PROFILE, profileId);
        return true;
    } catch (e) {
        return false;
    }
}

export function createProfile(name) {
    try {
        const profiles = getAllProfiles();
        const newProfile = {
            id: generateUUID(),
            name: name || "New Player",
            created_at: Date.now()
        };
        profiles.push(newProfile);
        setStorageItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
        setStorageItem(STORAGE_KEY_ACTIVE_PROFILE, newProfile.id);
        return newProfile;
    } catch (e) {
        return null;
    }
}

export function deleteProfile(profileId) {
    try {
        let profiles = getAllProfiles();
        profiles = profiles.filter(p => p.id !== profileId);
        setStorageItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
        if (getStorageItem(STORAGE_KEY_ACTIVE_PROFILE) === profileId && profiles.length > 0) {
            setStorageItem(STORAGE_KEY_ACTIVE_PROFILE, profiles[0].id);
        }
        return true;
    } catch (e) {
        return false;
    }
}