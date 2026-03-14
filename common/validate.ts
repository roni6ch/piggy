import { AuthErrors, LoginAuth, RegisterAuth } from './types';

const loginValidate = (values: LoginAuth): LoginAuth => {
  const { email, password } = values;
  const errors: LoginAuth = {} as LoginAuth;

  if (!email) {
    errors.email = AuthErrors.REQUIRED;
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email)) {
    errors.email = AuthErrors.INVALID_EMAIL_ADDESS;
  }

  if (!password) {
    errors.password = AuthErrors.REQUIRED;
  } else if (password.length < 6 || password.length > 20) {
    errors.password = AuthErrors.INPUT_LENGTH_ERROR;
  } else if (password.includes(' ')) {
    errors.password = AuthErrors.INVALID_PASSWORD;
  }
  return errors;
};

const registerValidate = (values: RegisterAuth): RegisterAuth => {
  const { username, email, password, cpassword } = values;
  const errors: RegisterAuth = {} as RegisterAuth;

  if (!username) {
    errors.username = AuthErrors.REQUIRED;
  } else if (username.includes(' ')) {
    errors.username = AuthErrors.INVALID_USERNAME;
  }

  if (!email) {
    errors.email = AuthErrors.REQUIRED;
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email)) {
    errors.email = AuthErrors.INVALID_EMAIL_ADDESS;
  }

  if (!password) {
    errors.password = AuthErrors.REQUIRED;
  } else if (password.length < 6 || password.length > 20) {
    errors.password = AuthErrors.INPUT_LENGTH_ERROR;
  } else if (password.includes(' ')) {
    errors.password = AuthErrors.INVALID_PASSWORD;
  }

  if (!cpassword) {
    errors.cpassword = AuthErrors.REQUIRED;
  } else if (password !== cpassword) {
    errors.cpassword = AuthErrors.PASSWORDS_NOT_MATCH;
  } else if (cpassword.includes(' ')) {
    errors.password = AuthErrors.INVALID_CONFIRM_PASSWORD;
  }
  return errors;
};

export { loginValidate, registerValidate };
