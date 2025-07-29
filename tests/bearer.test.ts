import { BearerToken } from '../src/api';

describe('BearerToken', () => {
  it('returns token and auth header', () => {
    const token = new BearerToken('abc');
    expect(token.getToken()).toBe('abc');
    expect(token.getAuthHeader()).toBe('Bearer abc');
  });
});
