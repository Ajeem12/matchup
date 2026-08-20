import { customAlphabet } from 'nanoid';

// Excludes visually ambiguous characters (0/O, 1/I) for easier manual entry.
const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

export const generateRoomCode = () => nanoid();
