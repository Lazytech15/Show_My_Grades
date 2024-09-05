// dataModule.js
const STORAGE_KEY = 'studentEmail';

export function setStudentEmail(email) {
  localStorage.setItem(STORAGE_KEY, email);
}

export function getStudentEmail() {
  return localStorage.getItem(STORAGE_KEY);
}