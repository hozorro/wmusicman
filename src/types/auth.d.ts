declare interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
}
declare interface UserInfo {
  id: number;
  is_admin: boolean,
  username: string;
}