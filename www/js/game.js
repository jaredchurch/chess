// game.js - Chess game logic utilities

export function parseFenPieces(fen) {
    const placement = fen.split(' ')[0];
    const rows = placement.split('/');
    const pieces = {};

    rows.forEach((row, i) => {
        const rank = 8 - i;
        let file = 0;
        for (const char of row) {
            if (isNaN(char)) {
                pieces[String.fromCharCode(97 + file) + rank] = char;
                file++;
            } else {
                file += parseInt(char);
            }
        }
    });
    return pieces;
}

export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}