import * as Yup from 'yup';

export const loginValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

export const registerValidationSchema = Yup.object().shape({
  name: Yup.string()
    .required('User name is required')
    .min(3, 'User name must be at least 3 characters'),
  email: Yup.string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirm_password: Yup.string()
    .required('Confirm password is required')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
});

export const forgotPasswordValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
});

export const changePasswordValidationSchema = Yup.object().shape({
  code: Yup.string().required('OTP Code is required'),

  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('New password is required'),

  confirm_password: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Confirm password is required'),
});

export const journalSchema = Yup.object().shape({
  title: Yup.string().trim().required('Title is required'),
  description: Yup.string().test('not-empty', 'Description is required', value => {
    if (!value) return false;

    // remove html tags before validating
    const stripped = value
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/&nbsp;/g, '')
      .trim();

    return stripped.length > 0;
  }),
  tag: Yup.string().nullable(),
  promt: Yup.array().of(Yup.string().trim()).nullable(),
});

export const habitSchema = Yup.object().shape({
  title: Yup.string().trim().required('Title is required'),
  frequency: Yup.string()
    .oneOf(['Daily', 'Custom', '40 Days'], 'Frequency is required')
    .required('Frequency is required'),
});

export const profileEditValidationSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .required('Name is required')
    .min(3, 'Name must be at least 3 characters'),
  email: Yup.string()
    .trim()
    .email('Please enter a valid email address')
    .nullable()
    .notRequired(),
  phone: Yup.string()
    .trim()
    .matches(/^\+?[0-9]{7,15}$/, {
      message: 'Enter a valid phone number',
      excludeEmptyString: true,
    })
    .nullable()
    .notRequired(),
  city: Yup.string()
    .trim()
    .required('City is required')
    .min(2, 'City must be at least 2 characters'),
  state: Yup.string()
    .trim()
    .required('State is required')
    .min(2, 'State must be at least 2 characters'),
});
