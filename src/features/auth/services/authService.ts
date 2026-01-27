// Sistema de almacenamiento local de usuarios
const USERS_STORAGE_KEY = 'damabella_users';

export const getStoredUsers = () => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveUser = (user: any) => {
  const users = getStoredUsers();
  users.push(user);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const updateUserPassword = (email: string, newPassword: string) => {
  const users = getStoredUsers();
  const userIndex = users.findIndex((u: any) => u.email === email);
  
  if (userIndex !== -1) {
    users[userIndex].password = newPassword;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return true;
  }
  return false;
};

export const findUserByEmail = (email: string) => {
  const users = getStoredUsers();
  return users.find((u: any) => u.email === email);
};

export const validateUserCredentials = (email: string, password: string) => {
  const users = getStoredUsers();
  return users.find((u: any) => u.email === email && u.password === password);
};

export const emailExists = (email: string) => {
  const users = getStoredUsers();
  return users.some((u: any) => u.email === email);
};

export const documentExists = (numeroDoc: string) => {
  const users = getStoredUsers();
  return users.some((u: any) => u.numeroDoc === numeroDoc);
};






