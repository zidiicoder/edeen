import * as Yup from 'yup';

export const profileChangePasswordValidationSchema = Yup.object().shape({
  current_password: Yup.string()
    .required('Current password is required')
    .min(6, 'Current password must be at least 6 characters'),
  new_password: Yup.string()
    .required('New password is required')
    .min(6, 'New password must be at least 6 characters')
    .notOneOf(
      [Yup.ref('current_password')],
      'New password must be different from current password',
    ),
  new_password_confirmation: Yup.string()
    .required('Confirm new password is required')
    .oneOf([Yup.ref('new_password')], 'New passwords must match'),
});
