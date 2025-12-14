/**
 * Mock for next-auth module
 * This mock is automatically loaded by Jest for all files that import next-auth
 */

const mockNextAuth = jest.fn(() => jest.fn());

// Export default as a function that returns a function (Next.js API route handler)
export default mockNextAuth;

// Export getServerSession mock
export const getServerSession = jest.fn(() =>
  Promise.resolve({
    user: {
      id: '000000000000000000000001',
      email: 'test@example.com',
      name: 'Test User',
    },
  })
);

// Export other NextAuth functions as needed
export const  getSession = jest.fn();
export const auth = jest.fn();
