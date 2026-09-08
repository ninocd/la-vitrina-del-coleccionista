import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ytrxlbhcfxnwfqttupvw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_drgo1aaGYqTmdHOaCIA1CQ_Z3ngfXeD'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)