/**
 * Mock for next-auth/react module
 * This mock is automatically loaded by Jest for all files that import next-auth/react
 *
 * Note: Jest doesn't handle scoped packages well in __mocks__, so we use __ instead of /
 * The jest.config.ts moduleNameMapper handles the mapping
 */

import React from 'react';

export const useSession = jest.fn(() => ({
  data: {
    user: {
      id: '000000000000000000000001',
      email: 'test@example.com',
      name: 'Test User',
    },
  },
  status: 'authenticated',
}));

export const signIn = jest.fn();
export const signOut = jest.fn();
export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return React.createElement(React.Fragment, null, children);
};
