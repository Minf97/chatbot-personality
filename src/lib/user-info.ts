export interface UserInfo {
  name: string;
  email: string;
}

const USER_INFO_COOKIE_NAME = 'interview_user_info';

export function setUserInfoCookie(userInfo: UserInfo): void {
  if (typeof window === 'undefined') return;
  
  try {
    const expires = new Date();
    expires.setDate(expires.getDate() + 30); // 30 days expiry
    
    const cookieValue = encodeURIComponent(JSON.stringify(userInfo));
    document.cookie = `${USER_INFO_COOKIE_NAME}=${cookieValue}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  } catch (error) {
    console.error('Failed to set user info cookie:', error);
  }
}

export function getUserInfoCookie(): UserInfo | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cookies = document.cookie.split(';');
    const userInfoCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${USER_INFO_COOKIE_NAME}=`)
    );
    
    if (!userInfoCookie) return null;
    
    const cookieValue = userInfoCookie.split('=')[1];
    const decodedValue = decodeURIComponent(cookieValue);
    const userInfo = JSON.parse(decodedValue);
    
    // Validate the structure
    if (userInfo && typeof userInfo.name === 'string' && typeof userInfo.email === 'string') {
      return userInfo;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get user info cookie:', error);
    return null;
  }
}

export function clearUserInfoCookie(): void {
  if (typeof window === 'undefined') return;
  
  try {
    document.cookie = `${USER_INFO_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  } catch (error) {
    console.error('Failed to clear user info cookie:', error);
  }
}

export function hasUserInfoCookie(): boolean {
  return getUserInfoCookie() !== null;
}