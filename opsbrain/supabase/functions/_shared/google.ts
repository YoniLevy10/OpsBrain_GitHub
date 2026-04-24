export function googleAuthConfig(product: string | null | undefined) {
  if (product === 'gmail') {
    return {
      product: 'gmail',
      scopes: ['https://www.googleapis.com/auth/gmail.modify'],
    };
  }
  if (product === 'calendar') {
    return {
      product: 'calendar',
      scopes: ['https://www.googleapis.com/auth/calendar'],
    };
  }
  return {
    product: 'unknown',
    scopes: ['https://www.googleapis.com/auth/userinfo.email'],
  };
}

export function encodeState(payload: Record<string, unknown>) {
  const json = JSON.stringify(payload);
  // base64url
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

