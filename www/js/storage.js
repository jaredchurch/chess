// storage.js - localStorage persistence for game data

/**
 * Generates a unique UUID v4
 * @returns {string} UUID string
 */
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

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

/**
 * Gets game statistics for a profile
 * @param {string} profileId - Profile ID to get stats for
 * @returns {Object} Statistics object with total_games, wins, losses, draws, etc.
 */
export function getGameStats(profileId) {
    if (!profileId) return null;
    try {
        const key = `chess_games_${profileId}`;
        const gamesJson = getStorageItem(key);
        const games = gamesJson ? JSON.parse(gamesJson) : [];
        
        const stats = {
            total_games: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            checkmates: 0,
            stalemates: 0,
            in_progress: 0,
            by_result: {}
        };
        
        games.forEach(game => {
            if (game.result === 'in_progress') {
                stats.in_progress++;
                return;
            }
            
            stats.total_games++;
            
            // Count by result type
            if (!stats.by_result[game.result]) {
                stats.by_result[game.result] = 0;
            }
            stats.by_result[game.result]++;
            
            // Determine win/loss/draw
            if (game.result === 'draw' || game.result === 'stalemate') {
                stats.draws++;
            } else if (game.result === 'win_white' || game.result === 'win_black') {
                // Determine if player won or lost
                const playerSide = game.player_side;
                if (game.result === 'win_white' && playerSide === 'white') {
                    stats.wins++;
                } else if (game.result === 'win_black' && playerSide === 'black') {
                    stats.wins++;
                } else {
                    stats.losses++;
                }
            }
            
            // Count checkmates and stalemates
            if (game.result === 'checkmate') stats.checkmates++;
            if (game.result === 'stalemate') stats.stalemates++;
        });
        
        return stats;
    } catch (e) {
        console.warn('Failed to get game stats:', e);
        return null;
    }
}