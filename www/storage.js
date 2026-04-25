// storage.js - localStorage persistence for game data

const STORAGE_KEY_PROFILES = "chess_profiles";
const STORAGE_KEY_ACTIVE_PROFILE = "chess_active_profile";

export function localStorage() {
    return window.localStorage;
}

export function getStorageItem(key) {
    try {
        return localStorage().getItem(key);
    } catch (e) {
        return null;
    }
}

export function setStorageItem(key, value) {
    try {
        localStorage().setItem(key, value);
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
        
        let activeProfile = null;
        if (profileId) {
            activeProfile = profiles.find(p => p.id === profileId) || null;
        }
        
        if (!activeProfile) {
            profileId = generateUUID();
            activeProfile = {
                id: profileId,
                name: "Player",
                created_at: Date.now()
            };
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

export function saveCurrentGameState(currentGame) {
    if (!currentGame) return;
    try {
        const key = `chess_games_${currentGame.profile_id}`;
        let gamesJson = getStorageItem(key);
        let games = gamesJson ? JSON.parse(gamesJson) : [];
        
        // Remove any other in_progress games for this profile (only one at a time)
        games = games.filter(g => g.result !== "in_progress" || g.game_id === currentGame.game_id);
        
        const existingIdx = games.findIndex(g => g.game_id === currentGame.game_id);
        if (existingIdx >= 0) {
            games[existingIdx] = currentGame;
        } else {
            games.push(currentGame);
        }
        
        setStorageItem(key, JSON.stringify(games));
    } catch (e) {
        console.warn("Save game state failed:", e);
    }
}

export function loadInProgressGame(profileId) {
    try {
        if (!profileId) return null;
        
        const key = `chess_games_${profileId}`;
        const gamesJson = getStorageItem(key);
        if (!gamesJson) return null;
        
        const games = JSON.parse(gamesJson);
        
        // Find the most recent in-progress game
        let inProgress = null;
        for (const game of games) {
            if (game.result === "in_progress") {
                if (!inProgress || game.last_modified > inProgress.last_modified) {
                    inProgress = game;
                }
            }
        }
        
        return inProgress;
    } catch (e) {
        console.warn("Load game failed:", e);
        return null;
    }
}

export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function exportHistory(profileId) {
    if (!profileId) return;
    const key = `chess_games_${profileId}`;
    const gamesJson = getStorageItem(key);
    const games = gamesJson ? JSON.parse(gamesJson) : [];
    const profile = { id: profileId, name: "Player", created_at: Date.now() };
    const exportData = { version: 1, profile, games };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export function importHistory(profileId, data) {
    const importedProfile = data.profile;
    const importedGames = data.games;
    
    // Ensure profile exists
    let profilesJson = getStorageItem(STORAGE_KEY_PROFILES);
    let profiles = profilesJson ? JSON.parse(profilesJson) : [];
    const existingProfile = profiles.find(p => p.id === importedProfile.id);
    if (!existingProfile) {
        profiles.push(importedProfile);
        setStorageItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
    }
    
    // Merge games
    const key = `chess_games_${importedProfile.id}`;
    let existingJson = getStorageItem(key);
    let existingGames = existingJson ? JSON.parse(existingJson) : [];
    
    for (const game of importedGames) {
        const existingIdx = existingGames.findIndex(g => g.game_id === game.game_id);
        if (existingIdx >= 0) {
            existingGames[existingIdx] = game;
        } else {
            existingGames.push(game);
        }
    }
    
    setStorageItem(key, JSON.stringify(existingGames));
    return importedGames.length;
}