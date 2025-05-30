'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/supabaseServer'

export const loginWithCredentials = async (email: string, password: string) => {
  const supabase = await createClient()
  return await supabase.auth.signInWithPassword({
      email,
      password,
    });
}

 export const logout = async () => {
    const supabase = await createClient()
    await supabase.auth.signOut()

    revalidatePath('/', 'layout')
    redirect('/login')
  }
