import {draftMode} from 'next/headers'
import {NextResponse} from 'next/server'

export async function GET() {
  const dm = await draftMode()
  dm.disable()
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
}
