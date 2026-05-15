import axios from 'axios';

function login(identifier, password) {
  return axios.post('/api/auth/login', { identifier, password });
}

function register(loginId, password, email) {
  return axios.post('/api/auth/register', { loginId, password, email });
}

export default {
  login,
  register,
};
