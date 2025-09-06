import bcrypt from 'bcrypt';

export const bcryptUtil = {
  compare: async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);

  },
  hash: async (password: string): Promise<string> => {
    return bcrypt.hash(password, 10);
  },
}