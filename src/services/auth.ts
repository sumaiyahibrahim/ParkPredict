import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
export const supabaseAuthConfigured = Boolean(supabase);

export async function requestSignInCode(input: {
  method: 'email' | 'phone';
  email: string;
  phone: string;
  name: string;
}) {
  if (!supabase)
    throw new Error(
      'Secure sign-in is not configured. Use the device-only demo profile, or add Supabase credentials.',
    );
  const options = { shouldCreateUser: true, data: { full_name: input.name, phone: input.phone } };
  const result =
    input.method === 'email'
      ? await supabase.auth.signInWithOtp({ email: input.email, options })
      : await supabase.auth.signInWithOtp({ phone: input.phone, options });
  if (result.error) throw result.error;
}

export async function confirmSignInCode(input: {
  method: 'email' | 'phone';
  email: string;
  phone: string;
  token: string;
}) {
  if (!supabase) throw new Error('Supabase sign-in is not configured.');
  const result =
    input.method === 'email'
      ? await supabase.auth.verifyOtp({ email: input.email, token: input.token, type: 'email' })
      : await supabase.auth.verifyOtp({ phone: input.phone, token: input.token, type: 'sms' });
  if (result.error) throw result.error;
  return result.data.user;
}

export async function signOutUser() {
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}
